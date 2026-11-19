import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class VietnameseValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    // 1. Ưu tiên kiểm tra nếu DTO khai báo static Zod Schema (Nhanh, chuẩn RESTful, an toàn tuyệt đối)
    const targetMeta = metadata.metatype as any;
    if (targetMeta && targetMeta.schema && typeof targetMeta.schema.safeParse === 'function') {
      const parsed = targetMeta.schema.safeParse(value);
      if (!parsed.success) {
        const errorMap: Record<string, string> = {};
        const messages: string[] = [];
        for (const issue of parsed.error.issues) {
          const field = issue.path.join('.') || 'payload';
          const msg = issue.message || `Trường "${field}" không hợp lệ.`;
          errorMap[field] = msg;
          messages.push(msg);
        }
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: messages.join('; ') || 'Dữ liệu gửi lên không đúng định dạng yêu cầu!',
          errors: errorMap,
        });
      }
      return parsed.data;
    }

    try {
      // Safely try dynamic load if available in environment
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const cv = require('class-validator');
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ct = require('class-transformer');
      if (cv && cv.validate && ct && ct.plainToInstance) {
        const object = ct.plainToInstance(metadata.metatype, value);
        const errors = await cv.validate(object, { whitelist: true });
        if (errors && errors.length > 0) {
          const messages: string[] = [];
          const errorMap: Record<string, string> = {};
          for (const err of errors) {
            if (err.constraints) {
              const first = Object.keys(err.constraints)[0];
              let msg = `Trường ${err.property} không hợp lệ.`;
              switch (first) {
                case 'isNotEmpty':
                  msg = `Vui lòng nhập đầy đủ thông tin: "${err.property}". Không được để trống.`;
                  break;
                case 'isEmail':
                  msg = `Định dạng email "${err.property}" không hợp lệ (Ví dụ: user@example.com).`;
                  break;
                case 'minLength':
                  msg = `Trường "${err.property}" quá ngắn. Vui lòng nhập tối thiểu theo yêu cầu.`;
                  break;
                case 'maxLength':
                  msg = `Trường "${err.property}" vượt quá độ dài tối đa cho phép.`;
                  break;
                case 'isNumber':
                case 'isNumberString':
                  msg = `Trường "${err.property}" phải là định dạng số hợp lệ.`;
                  break;
                case 'isPositive':
                  msg = `Giá trị của "${err.property}" phải là số dương lớn hơn 0.`;
                  break;
                default:
                  msg = err.constraints[first] || msg;
                  break;
              }
              messages.push(msg);
              errorMap[err.property] = msg;
            }
          }
          throw new BadRequestException({
            statusCode: 400,
            message:
              messages.join('; ') ||
              'Dữ liệu gửi lên không đúng định dạng yêu cầu!',
            errors: errorMap,
          });
        }
        return object;
      }
    } catch (e: any) {
      if (e instanceof BadRequestException) throw e;
      // If class-validator is not present, gracefully return value without crashing
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

export function createVietnameseValidationPipe(): PipeTransform {
  return new VietnameseValidationPipe();
}
