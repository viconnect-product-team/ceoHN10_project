import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class DeclareSupplyDto {
  targetType: 'event' | 'training';
  targetId: string;
  targetName?: string;
  itemName: string;
  quantity?: number;
  unit?: string;
  sponsorId?: string;
  sponsorName?: string;
  isFromSponsor?: boolean;
  status?: string;
  estimatedCost?: number;
  department?: string;
  note?: string;
}

@Injectable()
export class SuppliesService {
  constructor(private readonly prisma: PrismaService) {}

  async listSupplies(targetType?: string, targetId?: string) {
    let sql = `SELECT * FROM public.event_supplies WHERE 1=1`;
    if (targetType) {
      sql += ` AND target_type = '${targetType.replace(/'/g, "''")}'`;
    }
    if (targetId) {
      sql += ` AND target_id = '${targetId.replace(/'/g, "''")}'`;
    }
    sql += ` ORDER BY created_at DESC`;

    const rows = await this.prisma.$queryRawUnsafe<any[]>(sql).catch(() => []);
    return rows.map((r) => ({
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      targetName: r.target_name || '',
      itemName: r.item_name,
      quantity: Number(r.quantity || 1),
      unit: r.unit || 'Cái',
      sponsorId: r.sponsor_id || null,
      sponsorName: r.sponsor_name || '',
      isFromSponsor: Boolean(r.is_from_sponsor),
      status: r.status || 'needed',
      estimatedCost: Number(r.estimated_cost || 0),
      department: r.department || 'Ban Sự kiện & Hậu cần',
      declaredBy: r.declared_by || null,
      declaredByName: r.declared_by_name || 'Ban Hậu cần',
      note: r.note || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async declareSupply(data: DeclareSupplyDto, userId?: string, userName?: string) {
    if (!data.itemName?.trim()) {
      throw new BadRequestException('Vui lòng nhập tên vật dụng hoặc thiết bị cần hỗ trợ');
    }
    if (!data.targetId?.trim()) {
      throw new BadRequestException('Vui lòng chọn sự kiện hoặc buổi học tương ứng');
    }

    const qty = Math.max(1, Number(data.quantity) || 1);
    const cost = Math.max(0, Number(data.estimatedCost) || 0);
    const unit = data.unit?.trim() || 'Cái';
    const dept = data.department?.trim() || 'Ban Sự kiện & Hậu cần';
    const declName = userName || 'Ban Sự kiện & Hậu cần';

    const res = await this.prisma.$queryRawUnsafe<any[]>(
      `
      INSERT INTO public.event_supplies (
        target_type, target_id, target_name, item_name, quantity, unit,
        sponsor_id, sponsor_name, is_from_sponsor, status, estimated_cost,
        department, declared_by, declared_by_name, note, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7::uuid, $8, $9, $10, $11,
        $12, $13::uuid, $14, $15, now(), now()
      )
      RETURNING *;
      `,
      data.targetType || 'event',
      data.targetId,
      data.targetName || '',
      data.itemName.trim(),
      qty,
      unit,
      data.sponsorId ? data.sponsorId : null,
      data.sponsorName || '',
      Boolean(data.isFromSponsor),
      data.status || 'needed',
      cost,
      dept,
      userId && userId.length === 36 ? userId : null,
      declName,
      data.note || '',
    );

    const r = res[0];
    return {
      id: r.id,
      targetType: r.target_type,
      targetId: r.target_id,
      targetName: r.target_name,
      itemName: r.item_name,
      quantity: Number(r.quantity),
      unit: r.unit,
      sponsorId: r.sponsor_id,
      sponsorName: r.sponsor_name,
      isFromSponsor: r.is_from_sponsor,
      status: r.status,
      estimatedCost: Number(r.estimated_cost),
      department: r.department,
      declaredByName: r.declared_by_name,
      note: r.note,
      createdAt: r.created_at,
    };
  }

  async updateSupply(id: string, data: Partial<DeclareSupplyDto>) {
    const existing = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM public.event_supplies WHERE id = $1::uuid LIMIT 1`,
      id,
    ).catch(() => []);

    if (existing.length === 0) {
      throw new NotFoundException('Không tìm thấy bản ghi vật dụng');
    }

    const cur = existing[0];
    const itemName = data.itemName !== undefined ? data.itemName.trim() : cur.item_name;
    const qty = data.quantity !== undefined ? Math.max(1, Number(data.quantity)) : cur.quantity;
    const unit = data.unit !== undefined ? data.unit.trim() : cur.unit;
    const status = data.status !== undefined ? data.status : cur.status;
    const cost = data.estimatedCost !== undefined ? Math.max(0, Number(data.estimatedCost)) : cur.estimated_cost;
    const note = data.note !== undefined ? data.note : cur.note;

    await this.prisma.$executeRawUnsafe(
      `
      UPDATE public.event_supplies SET
        item_name = $1,
        quantity = $2,
        unit = $3,
        status = $4,
        estimated_cost = $5,
        note = $6,
        updated_at = now()
      WHERE id = $7::uuid;
      `,
      itemName,
      qty,
      unit,
      status,
      cost,
      note,
      id,
    );

    return { id, success: true, message: 'Cập nhật vật dụng thành công' };
  }

  async deleteSupply(id: string) {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.event_supplies WHERE id = $1::uuid`,
      id,
    );
    return { id, success: true, message: 'Đã xóa vật dụng khai báo' };
  }

  /**
   * Lấy danh mục vật phẩm hiện vật có sẵn từ các Nhà Tài Trợ
   * Giúp Ban Sự kiện & Hậu cần chọn trực tiếp từ kho tài trợ
   */
  async getAvailableSponsorItems() {
    const sponsors = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT id, name, company_name, in_kind_items 
       FROM public.sponsors 
       WHERE sponsor_type = 'in_kind' OR (in_kind_items IS NOT NULL AND in_kind_items::text != '[]')`,
    ).catch(() => []);

    const items: Array<{
      sponsorId: string;
      sponsorName: string;
      companyName: string;
      itemName: string;
      totalQuantity: number;
      unit: string;
      estimatedValue: number;
      allocatedQuantity: number;
      availableQuantity: number;
    }> = [];

    for (const sp of sponsors) {
      let rawItems: any[] = [];
      try {
        rawItems = Array.isArray(sp.in_kind_items)
          ? sp.in_kind_items
          : JSON.parse(sp.in_kind_items || '[]');
      } catch {
        rawItems = [];
      }

      for (const it of rawItems) {
        const total = Number(it.quantity || it.qty || 1);
        const allocated = Number(it.allocatedQuantity || 0);
        const available = Math.max(0, total - allocated);
        items.push({
          sponsorId: sp.id,
          sponsorName: sp.name,
          companyName: sp.company_name || '',
          itemName: it.name || it.itemName || 'Vật phẩm tài trợ',
          totalQuantity: total,
          unit: it.unit || 'Cái',
          estimatedValue: Number(it.estimatedValue || 0),
          allocatedQuantity: allocated,
          availableQuantity: available,
        });
      }
    }

    return items;
  }
}
