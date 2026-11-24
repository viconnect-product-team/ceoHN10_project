import {
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiResponse, PaginatedResult } from '../dto/api-response.dto';
import { PaginationQueryDto } from '../dto/pagination.dto';

/**
 * BASE SERVICE ABSTRACTION - CEO HN10 BACKEND
 * Cung cấp các phương thức CRUD, phân trang, logging và chuẩn hóa phản hồi dùng chung
 */
export abstract class BaseService<T = any> {
  protected readonly logger: Logger;

  constructor(serviceName?: string) {
    this.logger = new Logger(serviceName || this.constructor.name);
  }

  /**
   * Tính toán offset và limit cho truy vấn phân trang
   */
  protected calculatePagination(query?: Partial<PaginationQueryDto>): {
    skip: number;
    take: number;
    page: number;
    limit: number;
  } {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;
    return { skip, take: limit, page, limit };
  }

  /**
   * Đóng gói kết quả danh sách thành cấu trúc phân trang chuẩn
   */
  protected createPaginatedResponse<U = T>(
    items: U[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<U> {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  /**
   * Chuẩn hóa phản hồi API thành công
   */
  protected formatSuccessResponse<U = T>(
    data: U,
    message: string = 'Thao tác thành công',
    statusCode: number = 200,
  ): ApiResponse<U> {
    return {
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Kiểm tra ID hợp lệ (không rỗng và đúng định dạng)
   */
  protected validateEntityId(id?: string, entityName: string = 'Bản ghi'): string {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new BadRequestException(`Mã định danh ${entityName} không hợp lệ.`);
    }
    return id.trim();
  }

  /**
   * Báo lỗi khi không tìm thấy bản ghi
   */
  protected throwNotFound(entityName: string = 'Bản ghi', id?: string): never {
    const detail = id ? ` với ID "${id}"` : '';
    throw new NotFoundException(`Không tìm thấy ${entityName}${detail}.`);
  }

  /**
   * Xử lý ngoại lệ tập trung với logging an toàn
   */
  protected handleServiceError(error: any, contextMessage: string): never {
    this.logger.error(`${contextMessage}: ${error?.message || error}`, error?.stack);
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }
    throw new InternalServerErrorException(
      `${contextMessage}. Vui lòng thử lại hoặc liên hệ quản trị viên.`,
    );
  }
}
