import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Đệ quy chuẩn hóa toàn bộ dữ liệu phản hồi JSON:
 * Chuyển đổi an toàn các trường BigInt (e.g. từ PostgreSQL COUNT, SUM, BIGINT id/amount)
 * thành Number (nếu nằm trong vùng an toàn) hoặc String để Express json.stringify không crash.
 */
export function sanitizeBigIntValue(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'bigint') {
    const num = Number(value);
    return Number.isSafeInteger(num) ? num : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeBigIntValue);
  }
  if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof RegExp)) {
    const sanitizedObj: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      sanitizedObj[key] = sanitizeBigIntValue(value[key]);
    }
    return sanitizedObj;
  }
  return value;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => sanitizeBigIntValue(data)));
  }
}
