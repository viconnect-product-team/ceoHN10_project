/**
 * TANSTACK START & TANSTACK QUERY STANDARD API CLIENT (Tans API Standard)
 * Quy chuẩn API thống nhất toàn hệ thống CEO HN10:
 * 1. Định dạng ID 100% chuẩn UUID / UID (String UUIDv4).
 * 2. Phản hồi chuẩn hóa: { success: boolean, data: T, message?: string, meta?: any }.
 * 3. Tương thích SSR (Nitro Node Server) & Client Hydration.
 */

import { fetchNestApi } from "./api-client";

export interface TansApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export interface TansQueryOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  params?: Record<string, string | number | boolean | undefined>;
}

/**
 * Trình gọi API chuẩn TanStack REST
 */
export async function tansApi<T = any>(
  endpoint: string,
  options?: RequestInit & TansQueryOptions
): Promise<TansApiResponse<T>> {
  let url = endpoint;
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) searchParams.append(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  try {
    const res = await fetchNestApi<any>(url, options);
    // Chuẩn hóa cấu trúc đầu ra theo Tans Standard
    if (res && typeof res === "object" && "success" in res && "data" in res) {
      return res as TansApiResponse<T>;
    }
    return {
      success: true,
      data: res as T,
      meta: Array.isArray(res) ? { total: res.length } : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      data: null as any,
      message: error?.message || "Lỗi giao tiếp API TanStack",
    };
  }
}

/**
 * Helper tạo Query Options cho TanStack Query (useQuery)
 */
export function createTansQueryOptions<T = any>(
  queryKey: readonly unknown[],
  endpoint: string,
  options?: TansQueryOptions
) {
  return {
    queryKey,
    queryFn: async (): Promise<T> => {
      const res = await tansApi<T>(endpoint, options);
      if (!res.success) {
        throw new Error(res.message || "Không thể tải dữ liệu");
      }
      return res.data;
    },
    staleTime: 1000 * 60 * 2, // 2 phút
    retry: 2,
  };
}

/**
 * Helper kiểm tra định dạng UUID/UID hợp lệ
 */
export function isValidUid(uid: string): boolean {
  if (!uid || typeof uid !== "string") return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uid);
}
