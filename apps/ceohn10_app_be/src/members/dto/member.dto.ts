import { z } from 'zod';

export class CreateMemberDto {
  static schema = z.object({
    name: z.string().trim().min(1, 'Họ và tên học viên / doanh nghiệp không được để trống'),
    contact: z.string().optional().nullable(),
    email: z
      .string()
      .trim()
      .email('Địa chỉ email không đúng định dạng (VD: example@ceohn10.vn)')
      .optional()
      .nullable()
      .or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(
        /^(0|\+84)[1-9][0-9]{8,9}$/,
        'Số điện thoại phải từ 10-11 chữ số và bắt đầu bằng số 0 hoặc +84 (VD: 0912345678)',
      )
      .optional()
      .nullable()
      .or(z.literal('')),
    type: z.enum(['company', 'individual']).optional().default('individual'),
    level: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    status: z.enum(['active', 'pending', 'expired', 'suspended']).optional().default('active'),
    address: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    taxCode: z.string().optional().nullable(),
    employees: z.number().nonnegative('Số lượng nhân viên không được âm').optional().nullable(),
    about: z.string().optional().nullable(),
    associationId: z.string().optional().nullable(),
    executiveRole: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    code: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    customData: z.record(z.any()).optional().nullable(),
    custom_data: z.record(z.any()).optional().nullable(),
  }).passthrough();

  name!: string;
  contact?: string;
  email?: string;
  phone?: string;
  type?: 'company' | 'individual';
  level?: string;
  industry?: string;
  region?: string;
  status?: 'active' | 'pending' | 'expired';
  address?: string;
  website?: string;
  taxCode?: string;
  employees?: number;
  about?: string;
  associationId?: string;
  executiveRole?: string;
  department?: string;
  code?: string;
  avatar?: string;
  customData?: Record<string, any>;
  custom_data?: Record<string, any>;
}

export class UpdateMemberDto {
  static schema = z.object({
    name: z.string().trim().min(1, 'Họ và tên không được để trống').optional(),
    contact: z.string().optional().nullable(),
    email: z
      .string()
      .trim()
      .email('Địa chỉ email không hợp lệ')
      .optional()
      .nullable()
      .or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(
        /^(0|\+84)[1-9][0-9]{8,9}$/,
        'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0 hoặc +84)',
      )
      .optional()
      .nullable()
      .or(z.literal('')),
    type: z.enum(['company', 'individual']).optional(),
    level: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    region: z.string().optional().nullable(),
    status: z.enum(['active', 'pending', 'expired', 'suspended']).optional(),
    address: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    taxCode: z.string().optional().nullable(),
    employees: z.number().optional().nullable(),
    about: z.string().optional().nullable(),
    feePaid: z.boolean().optional(),
    feeYear: z.number().optional(),
    paymentStatus: z.string().optional().nullable(),
    executiveRole: z.string().optional().nullable(),
    department: z.string().optional().nullable(),
    code: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    coverUrl: z.string().optional().nullable(),
    companyName: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    customData: z.record(z.any()).optional().nullable(),
    custom_data: z.record(z.any()).optional().nullable(),
  }).passthrough();

  name?: string;
  contact?: string;
  email?: string;
  phone?: string;
  type?: 'company' | 'individual';
  level?: string;
  industry?: string;
  region?: string;
  status?: 'active' | 'pending' | 'expired';
  address?: string;
  website?: string;
  taxCode?: string;
  employees?: number;
  about?: string;
  feePaid?: boolean;
  feeYear?: number;
  paymentStatus?: string;
  executiveRole?: string;
  department?: string;
  code?: string;
  avatar?: string;
  coverUrl?: string;
  companyName?: string;
  company?: string;
  customData?: Record<string, any>;
  custom_data?: Record<string, any>;
}

export class UpdateMemberContactDto {
  static schema = z.object({
    email: z.string().trim().email('Địa chỉ email không hợp lệ').optional().or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)[1-9][0-9]{8,9}$/, 'Số điện thoại không hợp lệ')
      .optional()
      .or(z.literal('')),
    address: z.string().optional(),
  });

  email?: string;
  phone?: string;
  address?: string;
}

export class PublicRegisterDto {
  static schema = z.object({
    fullName: z.string().trim().min(1, 'Họ và tên bắt buộc phải nhập'),
    phone: z
      .string()
      .trim()
      .regex(/^(0|\+84)[1-9][0-9]{8,9}$/, 'Số điện thoại liên hệ không hợp lệ (10-11 số)'),
    email: z.string().trim().email('Email liên hệ không đúng định dạng (VD: name@company.vn)'),
    companyName: z.string().trim().min(1, 'Tên công ty / Doanh nghiệp không được để trống'),
    position: z.string().optional().nullable(),
    birthYear: z.union([z.string(), z.number()]).optional().nullable(),
    taxCode: z.string().optional().nullable(),
    industry: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    website: z.string().optional().nullable(),
    staffSize: z.string().optional().nullable(),
    boardWish: z.string().optional().nullable(),
    needs: z.string().optional().nullable(),
    offers: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    associationId: z.string().optional().nullable(),
  }).passthrough();
  fullName!: string;
  phone!: string;
  email!: string;
  companyName!: string;
  position?: string;
  birthYear?: string | number;
  taxCode?: string;
  industry?: string;
  address?: string;
  website?: string;
  staffSize?: string;
  boardWish?: string;
  needs?: string;
  offers?: string;
  notes?: string;
  associationId?: string;
  [key: string]: any;
}

export class UpdateMemberProfileDto {
  name?: string;
  avatar?: string;
  coverUrl?: string;
  company?: string;
  position?: string;
  industry?: string;
  bio?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  [key: string]: any;
}

export class UpdateMemberExecutiveDto {
  executiveRole?: string;
  department?: string;
}

export class RenewMembershipDto {
  months?: number;
  feeAmount?: number;
  paymentMethod?: string;
  notes?: string;
}
