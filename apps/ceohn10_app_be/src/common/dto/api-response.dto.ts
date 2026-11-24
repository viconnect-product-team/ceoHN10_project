/**
 * CHUẨN HÓA PHẢN HỒI API (API RESPONSE DTO) - CEO HN10
 */

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResult<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string | string[];
  errors?: Record<string, string>;
  timestamp: string;
}
