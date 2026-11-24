import { z } from 'zod';

/**
 * CHUẨN HÓA THAM SỐ PHÂN TRANG & TÌM KIẾM (PAGINATION QUERY DTO)
 * Hỗ trợ xác thực qua Zod Schema tích hợp cùng VietnameseValidationPipe
 */

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().trim().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional().default('desc'),
});

export type PaginationQueryInput = z.infer<typeof PaginationQuerySchema>;

export class PaginationQueryDto {
  static schema = PaginationQuerySchema;

  page: number = 1;
  limit: number = 20;
  search?: string;
  sortBy?: string = 'createdAt';
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC' = 'desc';
}

export const UuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Mã định danh (ID) không đúng định dạng UUID hợp lệ' }),
});

export class UuidParamDto {
  static schema = UuidParamSchema;
  id!: string;
}
