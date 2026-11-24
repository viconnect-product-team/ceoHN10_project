/**
 * BASE ENTITY ABSTRACTION - CEO HN10 BACKEND
 * Định nghĩa cấu trúc thực thể chuẩn mực cho toàn bộ hệ thống
 */

export interface IBaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  isActive?: boolean;
}

export abstract class BaseEntity implements IBaseEntity {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date | null;
  isActive?: boolean = true;
}

export interface IAuditEntity extends IBaseEntity {
  createdBy?: string | null;
  updatedBy?: string | null;
}

export abstract class AuditEntity extends BaseEntity implements IAuditEntity {
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type EntityId = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}
