import {
  Injectable,
  OnModuleInit,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DuplicatePolicy,
  ExecuteImportDto,
  FieldMappingItem,
  ParseFileDto,
  SaveImportTemplateDto,
  SupportedEntityType,
  ValidateImportDto,
} from './dto/dynamic-import.dto';
import {
  computeFileSignature,
  extractExcelWorkbook,
  extractPdf,
  extractWordDocx,
  inferDataTypeFromValues,
  InferredFieldProposal,
  matchStandardCrmField,
  ParseResult,
  slugifyFieldName,
  EMAIL_REGEX,
  PHONE_REGEX,
} from './file-parser.util';

@Injectable()
export class DynamicImportService implements OnModuleInit {
  private readonly logger = new Logger(DynamicImportService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  async ensureSchema() {
    try {
      // 1. Tạo bảng import_templates
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.import_templates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          template_name TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          file_signature TEXT,
          field_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
          transformation_rules JSONB DEFAULT '{}'::jsonb,
          duplicate_policy TEXT DEFAULT 'skip',
          created_by TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_import_templates_entity ON public.import_templates(entity_type);
        CREATE INDEX IF NOT EXISTS idx_import_templates_sig ON public.import_templates(file_signature);
      `).catch(() => {});

      // 2. Tạo bảng import_jobs
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.import_jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size BIGINT DEFAULT 0,
          status TEXT DEFAULT 'completed',
          total_rows INT DEFAULT 0,
          successful_rows INT DEFAULT 0,
          failed_rows INT DEFAULT 0,
          duplicate_rows INT DEFAULT 0,
          new_fields_count INT DEFAULT 0,
          imported_by TEXT,
          error_summary TEXT,
          configuration_snapshot JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_import_jobs_entity ON public.import_jobs(entity_type);
        CREATE INDEX IF NOT EXISTS idx_import_jobs_created ON public.import_jobs(created_at DESC);
      `).catch(() => {});

      // 3. Tạo bảng import_errors
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.import_errors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          import_job_id UUID,
          row_number INT NOT NULL,
          source_data JSONB DEFAULT '{}'::jsonb,
          error_code TEXT,
          error_message TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_import_errors_job ON public.import_errors(import_job_id);
      `).catch(() => {});

      // 4. Safe DDL: Đảm bảo custom_data JSONB và GIN index trên các bảng Core CRM
      await this.prisma.$executeRawUnsafe(`
        ALTER TABLE public.members ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.event_registrations ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.trainings ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.financial_report_rows ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}'::jsonb;

        CREATE INDEX IF NOT EXISTS idx_members_custom_data ON public.members USING gin (custom_data);
        CREATE INDEX IF NOT EXISTS idx_event_reg_custom_data ON public.event_registrations USING gin (custom_data);
        CREATE INDEX IF NOT EXISTS idx_trainings_custom_data ON public.trainings USING gin (custom_data);
        CREATE INDEX IF NOT EXISTS idx_fin_rows_custom_data ON public.financial_report_rows USING gin (custom_data);
      `).catch(() => {});

      this.logger.log('✅ [DynamicImportService] Đã đồng bộ schema Dynamic Import & Hybrid Data');
    } catch (err: any) {
      this.logger.warn(`⚠️ [DynamicImportService] Schema init notice: ${err?.message || err}`);
    }
  }

  /**
   * Phân tích tệp tài liệu (Excel, CSV, Word, PDF) và đề xuất mapping thông minh
   */
  async parseFile(dto: ParseFileDto): Promise<ParseResult> {
    const fileName = dto.fileName || 'upload_file.xlsx';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let detectedType: 'excel' | 'csv' | 'word' | 'pdf' | 'text' = dto.fileType || 'excel';

    if (['xlsx', 'xls'].includes(ext)) detectedType = 'excel';
    else if (ext === 'csv') detectedType = 'csv';
    else if (['docx', 'doc'].includes(ext)) detectedType = 'word';
    else if (ext === 'pdf') detectedType = 'pdf';
    else if (ext === 'txt') detectedType = 'text';

    let tables: any[] = [];
    let buffer: Buffer | null = null;

    if (dto.fileBase64) {
      const cleanBase64 = dto.fileBase64.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanBase64, 'base64');
    }

    if (buffer) {
      if (detectedType === 'excel' || detectedType === 'csv') {
        tables = extractExcelWorkbook(buffer, fileName);
      } else if (detectedType === 'word') {
        tables = extractWordDocx(buffer, fileName);
      } else if (detectedType === 'pdf') {
        tables = extractPdf(buffer, fileName);
      }
    } else if (dto.tables && dto.tables.length > 0) {
      tables = dto.tables;
    }

    if (tables.length === 0) {
      throw new BadRequestException('Không tìm thấy dữ liệu bảng trong tệp đã tải lên.');
    }

    const selectedTable =
      tables.find((t) => t.sheetName === dto.sheetName) || tables[0];
    const headers: string[] = selectedTable.headers || [];
    const sampleRows: Record<string, any>[] = selectedTable.sampleRows || selectedTable.rows.slice(0, 10);
    const fileSignature = computeFileSignature(headers);

    // Xác định EntityType mục tiêu (từ dto hoặc dự đoán theo ngữ cảnh headers)
    let suggestedEntityType: SupportedEntityType = dto.entityType || 'member';
    if (!dto.entityType) {
      const allHeadersStr = headers.join(' ').toLowerCase();
      if (allHeadersStr.includes('vé') || allHeadersStr.includes('đại biểu') || allHeadersStr.includes('checkin')) {
        suggestedEntityType = 'event_registration';
      } else if (allHeadersStr.includes('buổi học') || allHeadersStr.includes('chuyên đề') || allHeadersStr.includes('lớp')) {
        suggestedEntityType = 'class';
      } else if (allHeadersStr.includes('giảng viên') || allHeadersStr.includes('diễn giả')) {
        suggestedEntityType = 'teacher';
      } else if (allHeadersStr.includes('thu') || allHeadersStr.includes('chi') || allHeadersStr.includes('chứng từ')) {
        suggestedEntityType = 'finance';
      }
    }

    // Đề xuất mapping cho từng cột
    const proposals: InferredFieldProposal[] = headers.map((col) => {
      const colValues = selectedTable.rows.map((r: any) => r[col]);
      const inferred = inferDataTypeFromValues(colValues);
      const match = matchStandardCrmField(col, suggestedEntityType);

      return {
        sourceColumn: col,
        targetFieldKey: match.key,
        targetFieldLabel: match.label,
        targetFieldType: match.defaultType || inferred.type,
        isCustomField: match.isCustom,
        confidence: match.confidence,
        options: inferred.options,
        sampleValues: colValues.filter((v: any) => v !== undefined && v !== null && v !== '').slice(0, 5),
      };
    });

    const summary = `Phân tích thành công tệp [${fileName}] (${detectedType.toUpperCase()}): Tìm thấy ${tables.length} bảng/sheet, tổng cộng ${selectedTable.totalRows} dòng dữ liệu, nhận diện được ${headers.length} trường.`;

    return {
      fileName,
      fileType: detectedType,
      fileSize: buffer ? buffer.length : 0,
      fileSignature,
      sheets: tables.map((t) => t.sheetName),
      selectedSheet: selectedTable.sheetName,
      tables,
      suggestedEntityType,
      proposals,
      summary,
    };
  }

  /**
   * Kiểm tra tính hợp lệ dữ liệu và phát hiện trùng lặp
   */
  async validateImport(dto: ValidateImportDto) {
    const { entityType, mappings, rows, duplicatePolicy } = dto;
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Danh sách dòng dữ liệu rỗng.');
    }

    const keyMapping: Record<string, FieldMappingItem> = {};
    mappings.forEach((m) => {
      keyMapping[m.sourceColumn] = m;
    });

    // 1. Thu thập danh sách emails/phones/codes để kiểm tra trùng trong CSDL
    const incomingEmails = new Set<string>();
    const incomingPhones = new Set<string>();
    const incomingCodes = new Set<string>();

    rows.forEach((row) => {
      mappings.forEach((m) => {
        const val = String(row[m.sourceColumn] || '').trim();
        if (!val) return;
        if (m.targetFieldKey === 'email') incomingEmails.add(val.toLowerCase());
        if (m.targetFieldKey === 'phone') incomingPhones.add(val);
        if (m.targetFieldKey === 'code' || m.targetFieldKey === 'member_code') incomingCodes.add(val.toUpperCase());
      });
    });

    // 2. Tra cứu dữ liệu hiện có trong CSDL theo entityType
    const existingDuplicatesMap = new Map<string, boolean>();

    try {
      if (entityType === 'member') {
        const emailArr = Array.from(incomingEmails);
        const phoneArr = Array.from(incomingPhones);
        const codeArr = Array.from(incomingCodes);

        const existingMembers = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, code, email, phone FROM public.members 
           WHERE LOWER(email) = ANY($1::text[]) 
              OR phone = ANY($2::text[]) 
              OR UPPER(code) = ANY($3::text[])`,
          emailArr,
          phoneArr,
          codeArr,
        );

        existingMembers.forEach((m) => {
          if (m.email) existingDuplicatesMap.set(`email:${m.email.toLowerCase()}`, true);
          if (m.phone) existingDuplicatesMap.set(`phone:${m.phone}`, true);
          if (m.code) existingDuplicatesMap.set(`code:${m.code.toUpperCase()}`, true);
        });
      } else if (entityType === 'event_registration' && dto.eventId) {
        const emailArr = Array.from(incomingEmails);
        const phoneArr = Array.from(incomingPhones);
        const codeArr = Array.from(incomingCodes);

        const existingRegs = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id, member_code, email, phone FROM public.event_registrations 
           WHERE event_id = $1 
             AND (LOWER(email) = ANY($2::text[]) OR phone = ANY($3::text[]) OR UPPER(member_code) = ANY($4::text[]))`,
          dto.eventId,
          emailArr,
          phoneArr,
          codeArr,
        );

        existingRegs.forEach((r) => {
          if (r.email) existingDuplicatesMap.set(`email:${r.email.toLowerCase()}`, true);
          if (r.phone) existingDuplicatesMap.set(`phone:${r.phone}`, true);
          if (r.member_code) existingDuplicatesMap.set(`code:${r.member_code.toUpperCase()}`, true);
        });
      }
    } catch (err: any) {
      this.logger.warn(`Could not check duplicates in DB: ${err?.message}`);
    }

    // 3. Phân loại từng dòng
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let duplicateCount = 0;

    const validatedRows = rows.map((row, idx) => {
      const rowNumber = idx + 1;
      const issues: { level: 'error' | 'warning' | 'info'; message: string }[] = [];
      let isDuplicate = false;

      mappings.forEach((m) => {
        const rawVal = row[m.sourceColumn];
        const strVal = String(rawVal || '').trim();

        // Kiểm tra required
        if (m.isRequired && !strVal) {
          issues.push({
            level: 'error',
            message: `Trường bắt buộc "${m.targetFieldLabel}" bị để trống.`,
          });
        }

        // Kiểm tra Email
        if (m.targetFieldType === 'email' && strVal && !EMAIL_REGEX.test(strVal)) {
          issues.push({
            level: 'warning',
            message: `Email "${strVal}" có định dạng không chuẩn.`,
          });
        }

        // Kiểm tra Phone
        if (m.targetFieldType === 'phone' && strVal) {
          const cleanPhone = strVal.replace(/[\s\.\-\(\)]/g, '');
          if (!PHONE_REGEX.test(cleanPhone) && cleanPhone.length < 9) {
            issues.push({
              level: 'warning',
              message: `Số điện thoại "${strVal}" có thể không hợp lệ.`,
            });
          }
        }

        // Kiểm tra Duplicate với DB
        if (m.targetFieldKey === 'email' && strVal && existingDuplicatesMap.has(`email:${strVal.toLowerCase()}`)) {
          isDuplicate = true;
        }
        if (m.targetFieldKey === 'phone' && strVal && existingDuplicatesMap.has(`phone:${strVal}`)) {
          isDuplicate = true;
        }
        if ((m.targetFieldKey === 'code' || m.targetFieldKey === 'member_code') && strVal && existingDuplicatesMap.has(`code:${strVal.toUpperCase()}`)) {
          isDuplicate = true;
        }
      });

      if (isDuplicate) {
        duplicateCount++;
        issues.push({
          level: 'warning',
          message: `Phát hiện dữ liệu đã tồn tại trong CSDL (${duplicatePolicy === 'skip' ? 'Sẽ bỏ qua' : duplicatePolicy === 'update' ? 'Sẽ cập nhật' : 'Sẽ tạo mới'}).`,
        });
      }

      const hasError = issues.some((i) => i.level === 'error');
      const hasWarning = issues.some((i) => i.level === 'warning');

      if (hasError) errorCount++;
      else if (hasWarning) warningCount++;
      else validCount++;

      return {
        rowNumber,
        data: row,
        status: hasError ? 'invalid' : isDuplicate ? 'duplicate' : hasWarning ? 'warning' : 'valid',
        issues,
      };
    });

    return {
      totalRows: rows.length,
      validRows: validCount,
      warningRows: warningCount,
      errorRows: errorCount,
      duplicateRows: duplicateCount,
      duplicatePolicy,
      rows: validatedRows,
    };
  }

  /**
   * Thực thi Import dữ liệu và cập nhật Dynamic Schema
   */
  async executeImport(dto: ExecuteImportDto) {
    const {
      entityType,
      fileName,
      fileType,
      fileSize,
      mappings,
      rows,
      duplicatePolicy,
      eventId,
      templateName,
      saveAsTemplate,
      importedBy,
    } = dto;

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Không có dòng dữ liệu nào để import.');
    }

    // 1. Đảm bảo Schema & Tạo các trường động mới vào dynamic_form_fields
    const customMappings = mappings.filter((m) => m.isCustomField);
    let newFieldsCount = 0;

    try {
      // Lấy schema ID
      const schemaRows = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT id FROM public.dynamic_form_schemas WHERE entity_type = $1 LIMIT 1`,
        entityType,
      );
      let schemaId = schemaRows[0]?.id;

      if (!schemaId) {
        const createdSchema = await this.prisma.$queryRawUnsafe<any[]>(
          `INSERT INTO public.dynamic_form_schemas (id, entity_type, name, description, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
           RETURNING id`,
          entityType,
          `Schema ${entityType}`,
          `Tự động tạo từ Dynamic Import`,
        );
        schemaId = createdSchema[0]?.id;
      }

      for (const cm of customMappings) {
        const existingField = await this.prisma.$queryRawUnsafe<any[]>(
          `SELECT id FROM public.dynamic_form_fields WHERE schema_id = $1::uuid AND field_name = $2 LIMIT 1`,
          schemaId,
          cm.targetFieldKey,
        );

        if (existingField.length === 0) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.dynamic_form_fields (
              id, schema_id, field_name, field_label, field_type, options, is_required, is_enabled, order_index, metadata, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1::uuid, $2, $3, $4, $5::jsonb, $6, true, 99, $7::jsonb, NOW(), NOW()
            )`,
            schemaId,
            cm.targetFieldKey,
            cm.targetFieldLabel,
            cm.targetFieldType,
            JSON.stringify(cm.options || []),
            Boolean(cm.isRequired),
            JSON.stringify({ isSearchable: cm.isSearchable ?? true, isFilterable: cm.isFilterable ?? true }),
          );
          newFieldsCount++;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not sync dynamic_form_fields: ${err?.message}`);
    }

    // 2. Tạo bản ghi import_jobs
    let jobId: string = '00000000-0000-0000-0000-000000000000';
    try {
      const jobRows = await this.prisma.$queryRawUnsafe<any[]>(
        `INSERT INTO public.import_jobs (
          id, entity_type, original_filename, file_type, file_size, status, total_rows, imported_by, configuration_snapshot, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, 'processing', $5, $6, $7::jsonb, NOW()
        ) RETURNING id`,
        entityType,
        fileName,
        fileType,
        fileSize || 0,
        rows.length,
        importedBy || 'Admin',
        JSON.stringify({ mappings, duplicatePolicy, eventId }),
      );
      jobId = jobRows[0]?.id;
    } catch (err: any) {
      this.logger.warn(`Could not create import_job record: ${err?.message}`);
    }

    // 3. Thực hiện ghi dữ liệu từng dòng
    let successfulRows = 0;
    let failedRows = 0;
    let duplicateRows = 0;
    const errorsToLog: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 1;

      try {
        const coreData: Record<string, any> = {};
        const customData: Record<string, any> = {};

        mappings.forEach((m) => {
          const val = row[m.sourceColumn];
          if (m.isCustomField) {
            customData[m.targetFieldKey] = val !== undefined ? val : null;
          } else {
            coreData[m.targetFieldKey] = val !== undefined ? val : null;
          }
        });

        // Xử lý theo từng Entity
        if (entityType === 'member') {
          const email = (coreData.email || '').trim().toLowerCase();
          const phone = (coreData.phone || '').trim();
          const code = (coreData.code || '').trim().toUpperCase();
          const name = (coreData.name || '').trim();

          if (!name) {
            throw new Error('Họ và tên không được để trống.');
          }

          // Kiểm tra trùng
          let existingId: string | null = null;
          if (email || phone || code) {
            const found = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT id FROM public.members WHERE ($1 != '' AND LOWER(email) = $1) OR ($2 != '' AND phone = $2) OR ($3 != '' AND UPPER(code) = $3) LIMIT 1`,
              email,
              phone,
              code,
            );
            if (found.length > 0) {
              existingId = found[0].id;
            }
          }

          if (existingId) {
            duplicateRows++;
            if (duplicatePolicy === 'skip') {
              continue;
            } else if (duplicatePolicy === 'update') {
              await this.prisma.$executeRawUnsafe(
                `UPDATE public.members SET
                  name = COALESCE($1, name),
                  company = COALESCE($2, company),
                  position = COALESCE($3, position),
                  industry = COALESCE($4, industry),
                  address = COALESCE($5, address),
                  custom_data = COALESCE(custom_data, '{}'::jsonb) || $6::jsonb,
                  updated_at = NOW()
                 WHERE id = $7`,
                name,
                coreData.company || null,
                coreData.position || null,
                coreData.industry || null,
                coreData.address || null,
                JSON.stringify(customData),
                existingId,
              );
              successfulRows++;
              continue;
            }
          }

          // Tạo mới member kèm tài khoản đăng nhập App CEOHN10 (chỉ có quyền App, không có quyền CRM)
          const memberId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const genCode = code || `HN10-${Date.now().toString().slice(-4)}`;
          let assignedUserId: string | null = null;

          if (email && email.includes('@')) {
            try {
              const existingUsers = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id FROM public.vione_users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1`,
                email,
              );
              if (existingUsers.length > 0) {
                assignedUserId = existingUsers[0].id;
              } else {
                const newUid = `c1${Date.now().toString(16).padStart(10, '0').slice(-10)}-0000-4000-8000-${Math.floor(100000000000 + Math.random() * 899999999999)}`;
                const defaultHash = '$2b$10$V3Z.z/BLpNnxmA/8eAkdQO6cJKUkRq0ZpZJcAcAeEMlRrJ3xzULCK'; // 123456
                const createdU = await this.prisma.$queryRawUnsafe<any[]>(
                  `INSERT INTO public.vione_users (id, username, email, name, password, email_verified, created_at, updated_at)
                   VALUES (gen_random_uuid(), $1, $1, $2, $3, true, NOW(), NOW())
                   RETURNING id`,
                  email,
                  name,
                  defaultHash,
                );
                assignedUserId = createdU[0]?.id || null;
                if (assignedUserId) {
                  await this.prisma.$executeRawUnsafe(
                    `INSERT INTO public.user_roles (user_id, role) VALUES ($1::uuid, 'member'::public.app_role) ON CONFLICT DO NOTHING`,
                    assignedUserId,
                  ).catch(() => {});
                  await this.prisma.$executeRawUnsafe(
                    `INSERT INTO public.user_profiles (user_id, display_name, company_name, account_status, onboarding_status, created_at, updated_at)
                     VALUES ($1::uuid, $2, $3, 'active', 'new', NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING`,
                    assignedUserId,
                    name,
                    coreData.company || 'CLB Doanh Nhân CEO HN10',
                  ).catch(() => {});
                  await this.prisma.$executeRawUnsafe(
                    `INSERT INTO auth.users (id, email, role) VALUES ($1::uuid, $2, 'authenticated') ON CONFLICT (id) DO NOTHING`,
                    assignedUserId,
                    email,
                  ).catch(() => {});
                }
              }
            } catch {}
          }

          const appOnlySettings = JSON.stringify({
            targetSystem: 'app_only',
            canAccessCrm: false,
          });

          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.members (
              id, user_id, code, name, contact, email, phone, status, address, company_name, executive_role, department, card_visibility_settings, custom_data, created_at, updated_at
            ) VALUES (
              $1, $2::uuid, $3, $4, $5, $6, $7, 'active', $8, $9, 'member', 'Ban Gắn kết & Đời sống', $10::jsonb, $11::jsonb, NOW(), NOW()
            )`,
            memberId,
            assignedUserId,
            genCode,
            name,
            name,
            email,
            phone,
            coreData.address || '',
            coreData.company || '',
            appOnlySettings,
            JSON.stringify(customData),
          );
          successfulRows++;
        } else if (entityType === 'event_registration') {
          if (!eventId) throw new Error('Vui lòng chọn sự kiện tương ứng để import đại biểu.');
          const name = (coreData.member_name || coreData.name || '').trim();
          const email = (coreData.email || '').trim().toLowerCase();
          const phone = (coreData.phone || '').trim();
          const code = (coreData.member_code || '').trim().toUpperCase();

          if (!name) throw new Error('Họ tên đại biểu không được để trống.');

          let existingId: string | null = null;
          if (email || phone || code) {
            const found = await this.prisma.$queryRawUnsafe<any[]>(
              `SELECT id FROM public.event_registrations WHERE event_id = $1 AND (($2 != '' AND LOWER(email) = $2) OR ($3 != '' AND phone = $3) OR ($4 != '' AND UPPER(member_code) = $4)) LIMIT 1`,
              eventId,
              email,
              phone,
              code,
            );
            if (found.length > 0) existingId = found[0].id;
          }

          if (existingId) {
            duplicateRows++;
            if (duplicatePolicy === 'skip') {
              continue;
            } else if (duplicatePolicy === 'update') {
              await this.prisma.$executeRawUnsafe(
                `UPDATE public.event_registrations SET
                  member_name = COALESCE($1, member_name),
                  custom_data = COALESCE(custom_data, '{}'::jsonb) || $2::jsonb,
                  dynamic_data = COALESCE(dynamic_data, '{}'::jsonb) || $2::jsonb,
                  updated_at = NOW()
                 WHERE id = $3`,
                name,
                JSON.stringify(customData),
                existingId,
              );
              successfulRows++;
              continue;
            }
          }

          const regId = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const regCode = code || `TK-${Date.now().toString().slice(-4)}`;

          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.event_registrations (
              id, event_id, member_code, member_name, email, phone, status, ticket_type, custom_data, dynamic_data, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, 'confirmed', $7, $8::jsonb, $8::jsonb, NOW(), NOW()
            )`,
            regId,
            eventId,
            regCode,
            name,
            email,
            phone,
            coreData.ticket_type || 'standard',
            JSON.stringify(customData),
          );
          successfulRows++;
        } else if (entityType === 'class') {
          // Lưu buổi học / chuyên đề vào bảng public.trainings
          const title = (coreData.title || '').trim();
          if (!title) throw new Error('Tên buổi học / chuyên đề không được để trống.');

          const trainingId = `trn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.trainings (
              id, title, instructor_name, location, status, custom_data, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, 'upcoming', $4::jsonb, NOW(), NOW()
            )`,
            title,
            coreData.instructor_name || '',
            coreData.location || 'Hội trường CLB CEO HN10',
            JSON.stringify(customData),
          );
          successfulRows++;
        } else if (entityType === 'teacher') {
          // Lưu giảng viên vào public.trainings và cấp tài khoản App-Only (chỉ vào App CEOHN10)
          const name = (coreData.name || '').trim();
          const email = (coreData.email || '').trim().toLowerCase();
          const phone = (coreData.phone || '').trim();
          if (!name) throw new Error('Họ tên giảng viên không được để trống.');

          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.trainings (
              id, title, instructor_name, instructor_title, instructor_company, category, custom_data, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, $4, 'Giảng viên CLB', $5::jsonb, NOW(), NOW()
            )`,
            `Hồ sơ giảng viên: ${name}`,
            name,
            coreData.title || 'Chuyên gia',
            coreData.company || '',
            JSON.stringify(customData),
          );

          if (email && email.includes('@')) {
            try {
              const existingUsers = await this.prisma.$queryRawUnsafe<any[]>(
                `SELECT id FROM public.vione_users WHERE LOWER(email) = $1 OR LOWER(username) = $1 LIMIT 1`,
                email,
              );
              let assignedUserId: string | null = existingUsers[0]?.id || null;
              if (!assignedUserId) {
                const defaultHash = '$2b$10$V3Z.z/BLpNnxmA/8eAkdQO6cJKUkRq0ZpZJcAcAeEMlRrJ3xzULCK';
                const createdU = await this.prisma.$queryRawUnsafe<any[]>(
                  `INSERT INTO public.vione_users (id, username, email, name, password, email_verified, created_at, updated_at)
                   VALUES (gen_random_uuid(), $1, $1, $2, $3, true, NOW(), NOW())
                   RETURNING id`,
                  email,
                  name,
                  defaultHash,
                );
                assignedUserId = createdU[0]?.id || null;
                if (assignedUserId) {
                  await this.prisma.$executeRawUnsafe(
                    `INSERT INTO public.user_roles (user_id, role) VALUES ($1::uuid, 'member'::public.app_role) ON CONFLICT DO NOTHING`,
                    assignedUserId,
                  ).catch(() => {});
                  await this.prisma.$executeRawUnsafe(
                    `INSERT INTO public.user_profiles (user_id, display_name, company_name, professional_title, account_status, onboarding_status, created_at, updated_at)
                     VALUES ($1::uuid, $2, $3, $4, 'active', 'new', NOW(), NOW()) ON CONFLICT (user_id) DO NOTHING`,
                    assignedUserId,
                    name,
                    coreData.company || 'CLB Doanh Nhân CEO HN10',
                    coreData.title || 'Giảng viên',
                  ).catch(() => {});
                }
              }
              if (assignedUserId) {
                const teacherMemId = `gv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
                const teacherCode = `GV-${Date.now().toString().slice(-4)}`;
                const appOnlySettings = JSON.stringify({ targetSystem: 'app_only', canAccessCrm: false });
                await this.prisma.$executeRawUnsafe(
                  `INSERT INTO public.members (
                    id, user_id, code, name, contact, email, phone, status, company_name, executive_role, department, card_visibility_settings, custom_data, created_at, updated_at
                  ) VALUES (
                    $1, $2::uuid, $3, $4, $4, $5, $6, 'active', $7, 'giang_vien', 'Ban Công nghệ', $8::jsonb, $9::jsonb, NOW(), NOW()
                  ) ON CONFLICT DO NOTHING`,
                  teacherMemId,
                  assignedUserId,
                  teacherCode,
                  name,
                  email,
                  phone,
                  coreData.company || 'CLB Doanh Nhân CEO HN10',
                  appOnlySettings,
                  JSON.stringify(customData),
                ).catch(() => {});
              }
            } catch {}
          }
          successfulRows++;
        } else if (entityType === 'finance') {
          // Lưu dòng tài chính vào public.financial_report_rows
          const category = (coreData.category || 'Thu/Chi khác').trim();
          const desc = (coreData.description || 'Giao dịch import').trim();
          const inc = Number(coreData.income_amount || coreData.amount || 0);
          const exp = Number(coreData.expense_amount || 0);

          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.financial_report_rows (
              id, transaction_date, voucher_no, category, description, income_amount, expense_amount, custom_data, created_at, updated_at
            ) VALUES (
              gen_random_uuid(), CURRENT_DATE, $1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW()
            )`,
            coreData.voucher_no || `VC-${Date.now().toString().slice(-4)}`,
            category,
            desc,
            inc,
            exp,
            JSON.stringify(customData),
          );
          successfulRows++;
        }
      } catch (err: any) {
        failedRows++;
        errorsToLog.push({
          rowNumber: rowNum,
          sourceData: row,
          message: err?.message || 'Lỗi không xác định khi lưu dòng dữ liệu',
        });
      }
    }

    // 4. Lưu lỗi vào import_errors
    if (errorsToLog.length > 0 && jobId !== '00000000-0000-0000-0000-000000000000') {
      try {
        for (const errItem of errorsToLog.slice(0, 50)) {
          await this.prisma.$executeRawUnsafe(
            `INSERT INTO public.import_errors (id, import_job_id, row_number, source_data, error_message, created_at)
             VALUES (gen_random_uuid(), $1::uuid, $2, $3::jsonb, $4, NOW())`,
            jobId,
            errItem.rowNumber,
            JSON.stringify(errItem.sourceData),
            errItem.message,
          );
        }
      } catch {}
    }

    // 5. Cập nhật import_jobs
    if (jobId !== '00000000-0000-0000-0000-000000000000') {
      try {
        await this.prisma.$executeRawUnsafe(
          `UPDATE public.import_jobs SET
            status = 'completed',
            successful_rows = $1,
            failed_rows = $2,
            duplicate_rows = $3,
            new_fields_count = $4,
            error_summary = $5,
            completed_at = NOW()
           WHERE id = $6::uuid`,
          successfulRows,
          failedRows,
          duplicateRows,
          newFieldsCount,
          errorsToLog.length > 0 ? `${errorsToLog.length} dòng lỗi phát sinh` : 'Hoàn tất trọn vẹn',
          jobId,
        );
      } catch {}
    }

    // 6. Lưu template nếu được yêu cầu
    if (saveAsTemplate && templateName) {
      await this.saveTemplate({
        templateName,
        entityType,
        mappings,
        duplicatePolicy,
      }).catch(() => {});
    }

    return {
      ok: true,
      jobId,
      totalRows: rows.length,
      successfulRows,
      failedRows,
      duplicateRows,
      newFieldsCount,
      errors: errorsToLog,
      summary: `Đã nhập thành công ${successfulRows}/${rows.length} bản ghi vào ${entityType} (${duplicateRows} bản ghi trùng, ${newFieldsCount} trường động mới được sinh).`,
    };
  }

  /**
   * Lưu hoặc cập nhật Mẫu Import (Template)
   */
  async saveTemplate(dto: SaveImportTemplateDto) {
    const { templateName, entityType, fileSignature, mappings, duplicatePolicy, transformationRules, createdBy } = dto;
    if (!templateName) throw new BadRequestException('Tên mẫu không được để trống.');

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.import_templates (
        id, template_name, entity_type, file_signature, field_mappings, transformation_rules, duplicate_policy, created_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, NOW(), NOW()
      ) RETURNING *`,
      templateName,
      entityType,
      fileSignature || null,
      JSON.stringify(mappings || []),
      JSON.stringify(transformationRules || {}),
      duplicatePolicy || 'skip',
      createdBy || 'Admin',
    );
    return rows[0];
  }

  /**
   * Lấy danh sách mẫu import theo entityType hoặc tất cả
   */
  async getTemplates(entityType?: string) {
    if (entityType && entityType !== 'all') {
      return this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.import_templates WHERE entity_type = $1 ORDER BY updated_at DESC`,
        entityType,
      );
    }
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.import_templates ORDER BY updated_at DESC`,
    );
  }

  /**
   * Xóa mẫu import
   */
  async deleteTemplate(id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.import_templates WHERE id = $1::uuid`,
      id,
    );
    return { ok: true, message: 'Đã xóa mẫu import thành công.' };
  }

  /**
   * Lấy lịch sử import theo entityType
   */
  async getImportHistory(entityType?: string) {
    if (entityType && entityType !== 'all') {
      return this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.import_jobs WHERE entity_type = $1 ORDER BY created_at DESC LIMIT 50`,
        entityType,
      );
    }
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.import_jobs ORDER BY created_at DESC LIMIT 50`,
    );
  }

  /**
   * Lấy chi tiết lỗi của một phiên import
   */
  async getJobErrors(jobId: string) {
    return this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.import_errors WHERE import_job_id = $1::uuid ORDER BY row_number ASC LIMIT 100`,
      jobId,
    );
  }
}
