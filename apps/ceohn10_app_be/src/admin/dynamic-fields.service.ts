import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DynamicFormField {
  id: string;
  schema_id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'switch' | 'email' | 'phone';
  options: string[] | { label: string; value: string }[];
  placeholder?: string;
  default_value?: any;
  is_required: boolean;
  is_enabled: boolean;
  order_index: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class DynamicFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy cấu hình schema & danh sách trường động theo entity_type (VD: 'member', 'event', 'class')
   */
  async getSchemaByEntityType(entityType: string) {
    try {
      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.dynamic_form_schemas (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          entity_type TEXT NOT NULL,
          name TEXT,
          title TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS title TEXT;
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE public.dynamic_form_schemas ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

        CREATE TABLE IF NOT EXISTS public.dynamic_form_fields (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          schema_id UUID,
          field_name TEXT NOT NULL,
          field_label TEXT NOT NULL,
          field_type TEXT NOT NULL DEFAULT 'text',
          options JSONB DEFAULT '[]'::jsonb,
          placeholder TEXT,
          default_value TEXT,
          is_required BOOLEAN DEFAULT FALSE,
          is_enabled BOOLEAN DEFAULT TRUE,
          order_index INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `).catch(() => {});
    } catch {}

    let schemas: any[] = [];
    try {
      schemas = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.dynamic_form_schemas WHERE entity_type = $1 LIMIT 1`,
        entityType,
      );
    } catch {
      schemas = [];
    }

    let schema = schemas[0];
    if (!schema) {
      try {
        const created = await this.prisma.$queryRawUnsafe<any[]>(
          `INSERT INTO public.dynamic_form_schemas (id, entity_type, name, description, is_active, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, $3, true, NOW(), NOW())
           RETURNING *`,
          entityType,
          `Cấu hình trường động ${entityType}`,
          `Hệ thống trường động tùy biến cho ${entityType} - Ban Công Nghệ CEOHN10`,
        );
        schema = created[0];
      } catch {
        try {
          const fallbackCreated = await this.prisma.$queryRawUnsafe<any[]>(
            `INSERT INTO public.dynamic_form_schemas (id, entity_type, description, is_active, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, true, NOW(), NOW())
             RETURNING *`,
            entityType,
            `Hệ thống trường động tùy biến cho ${entityType} - Ban Công Nghệ CEOHN10`,
          );
          schema = fallbackCreated[0];
        } catch {
          schema = { id: '00000000-0000-0000-0000-000000000000', entity_type: entityType, name: entityType };
        }
      }
    }

    let fields: any[] = [];
    try {
      fields = await this.prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM public.dynamic_form_fields 
         WHERE entity_type = $1 
         ORDER BY COALESCE(display_order, 0) ASC, created_at ASC`,
        entityType,
      );
    } catch {
      fields = [];
    }

    return {
      schema,
      fields: fields.map((f) => ({
        ...f,
        field_name: f.field_key || f.field_name,
        order_index: f.display_order ?? f.order_index ?? 0,
        options: Array.isArray(f.options) ? f.options : typeof f.options === 'string' ? JSON.parse(f.options || '[]') : [],
        metadata: typeof f.metadata === 'string' ? JSON.parse(f.metadata || '{}') : (f.metadata || {}),
      })),
    };
  }

  /**
   * Thêm trường động mới
   */
  async addField(data: {
    schema_id?: string;
    entity_type?: string;
    field_name: string;
    field_label: string;
    field_type: string;
    options?: any[];
    placeholder?: string;
    default_value?: any;
    is_required?: boolean;
    is_enabled?: boolean;
    order_index?: number;
    metadata?: any;
  }) {
    let schemaId = data.schema_id;
    if (!schemaId && data.entity_type) {
      const schemaData = await this.getSchemaByEntityType(data.entity_type);
      schemaId = schemaData.schema.id;
    }

    if (!schemaId) {
      throw new NotFoundException('Không tìm thấy schema tương ứng');
    }

    const entityType = data.entity_type || 'member';
    const fieldKey = (data.field_name || (data as any).field_key || '').trim();
    const optionsJson = JSON.stringify(data.options || []);

    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO public.dynamic_form_fields (
        id, entity_type, field_key, field_label, field_type, options,
        placeholder, is_required, is_enabled, display_order, is_system_field, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, $2, $3, $4, $5::jsonb,
        $6, $7, $8, $9, false, NOW(), NOW()
      ) RETURNING *`,
      entityType,
      fieldKey,
      data.field_label,
      data.field_type || 'text',
      optionsJson,
      data.placeholder || '',
      Boolean(data.is_required),
      data.is_enabled !== undefined ? Boolean(data.is_enabled) : true,
      Number(data.order_index || 0),
    );

    const created = rows[0];
    return {
      ...created,
      field_name: created?.field_key || fieldKey,
      order_index: created?.display_order ?? Number(data.order_index || 0),
    };
  }

  /**
   * Cập nhật trường động
   */
  async updateField(id: string, data: Partial<DynamicFormField>) {
    const fields = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.dynamic_form_fields WHERE id::text = $1 LIMIT 1`,
      id,
    );
    if (!fields[0]) {
      throw new NotFoundException('Không tìm thấy trường cấu hình');
    }

    const current = fields[0];
    const fieldLabel = data.field_label ?? current.field_label;
    const fieldType = data.field_type ?? current.field_type;
    const optionsJson = JSON.stringify(data.options ?? current.options ?? []);
    const placeholder = data.placeholder ?? current.placeholder;
    const isRequired = data.is_required !== undefined ? Boolean(data.is_required) : current.is_required;
    const isEnabled = data.is_enabled !== undefined ? Boolean(data.is_enabled) : current.is_enabled;
    const displayOrder = data.order_index !== undefined ? Number(data.order_index) : (current.display_order ?? 0);

    const updated = await this.prisma.$queryRawUnsafe<any[]>(
      `UPDATE public.dynamic_form_fields SET
        field_label = $2,
        field_type = $3,
        options = $4::jsonb,
        placeholder = $5,
        is_required = $6,
        is_enabled = $7,
        display_order = $8,
        updated_at = NOW()
       WHERE id::text = $1
       RETURNING *`,
      id,
      fieldLabel,
      fieldType,
      optionsJson,
      placeholder,
      isRequired,
      isEnabled,
      displayOrder,
    );

    return {
      ...updated[0],
      field_name: updated[0]?.field_key || updated[0]?.field_name,
      order_index: updated[0]?.display_order ?? displayOrder,
    };
  }

  /**
   * Xóa trường động
   */
  async deleteField(id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.dynamic_form_fields WHERE id::text = $1`,
      id,
    );
    return { success: true, message: 'Đã xóa trường cấu hình thành công' };
  }
}
