import { app_role } from '@ceohn10/db';
import { z } from 'zod';

export class UpdateAccountProfileDto {
  static schema = z.object({
    name: z.string().optional(),
    email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
    avatar_url: z.string().optional(),
    professional_title: z.string().optional(),
    company_name: z.string().optional(),
    industry: z.string().optional(),
    region: z.string().optional(),
    bio: z.string().optional(),
    locale: z.string().optional(),
    timezone: z.string().optional(),
  });

  name?: string;
  email?: string;
  avatar_url?: string;
  professional_title?: string;
  company_name?: string;
  industry?: string;
  region?: string;
  bio?: string;
  locale?: string;
  timezone?: string;
}

export class ChangePasswordDto {
  static schema = z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự'),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phone: z.string().optional(),
    sendActivationEmail: z.boolean().optional(),
    fullName: z.string().optional(),
  });

  currentPassword?: string;
  newPassword!: string;
  email?: string;
  phone?: string;
  sendActivationEmail?: boolean;
  fullName?: string;
}

export class DeactivateAccountDto {
  password?: string;
}

export class ListUsersQueryDto {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class AdminCreateUserDto {
  static schema = z.object({
    username: z
      .string()
      .trim()
      .min(3, 'Tên đăng nhập / Email quản trị phải có tối thiểu 3 ký tự'),
    email: z.string().trim().email('Địa chỉ email không đúng định dạng').optional().or(z.literal('')),
    password: z
      .string()
      .min(6, 'Mật khẩu khởi tạo phải có tối thiểu 6 ký tự')
      .optional()
      .or(z.literal('')),
    name: z.string().optional(),
    code: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    role: z.string().optional(),
    executiveRole: z.string().optional(),
    department: z.string().optional(),
    account_status: z.string().optional(),
    targetSystem: z.string().optional(),
    customPermissions: z.array(z.string()).optional(),
  });

  username!: string;
  email?: string;
  password?: string;
  name?: string;
  code?: string;
  phone?: string;
  companyName?: string;
  role?: string | app_role;
  executiveRole?: string;
  department?: string;
  account_status?: string;
  targetSystem?: string;
  customPermissions?: string[];
}

export class AdminUpdateUserDto {
  static schema = z.object({
    name: z.string().optional(),
    email: z.string().trim().email('Địa chỉ email không đúng định dạng').optional().or(z.literal('')),
    code: z.string().optional(),
    phone: z.string().optional(),
    companyName: z.string().optional(),
    role: z.string().optional(),
    executiveRole: z.string().optional(),
    department: z.string().optional(),
    account_status: z.string().optional(),
    targetSystem: z.string().optional(),
    customPermissions: z.array(z.string()).optional(),
  });

  name?: string;
  email?: string;
  code?: string;
  phone?: string;
  companyName?: string;
  role?: string | app_role;
  executiveRole?: string;
  department?: string;
  account_status?: string;
  targetSystem?: string;
  customPermissions?: string[];
}

export class AdminResetPasswordDto {
  static schema = z.object({
    newPassword: z.string().min(6, 'Mật khẩu mới phải có tối thiểu 6 ký tự'),
  });

  newPassword!: string;
}

export class AdminToggleStatusDto {
  status?: string;
}
