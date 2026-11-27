import { ForbiddenException } from '@nestjs/common';

/**
 * Kiểm tra tài khoản có thuộc nhóm đặc quyền chỉnh sửa/xóa bản ghi của người khác hay không:
 * Chỉ Super Admin (`platform_admin`) và Lớp trưởng (`lop_truong`) mới được sửa/xóa bản ghi của người khác.
 */
export function isPrivilegedOwnerBypass(user: any): boolean {
  if (!user) return false;
  const email = String(user.email || user.username || '').toLowerCase().trim();
  if (email === 'admin@ceohn10.vn') return true;

  const role = String(user.role || user.executiveRole || user.executive_role || '').toLowerCase().trim();
  const roles: string[] = Array.isArray(user.roles)
    ? user.roles.map((r: any) => String(r || '').toLowerCase().trim())
    : [];

  const allRoles = new Set([role, ...roles].filter(Boolean));
  return allRoles.has('platform_admin') || allRoles.has('lop_truong') || Boolean(user.isPlatformAdmin) || Boolean(user.isPresident);
}

/**
 * Ràng buộc quyền sở hữu bản ghi (Owner-based Edit/Delete):
 * Người tạo chỉ sửa/xóa được chính bản ghi của mình, trừ Super Admin (`platform_admin`) và Lớp trưởng (`lop_truong`).
 */
export function assertRecordOwnershipOrPrivilege(
  user: any,
  createdByUserId?: string | null,
  createdByName?: string | null,
  actionLabel = 'chỉnh sửa hoặc xóa bản ghi này',
): void {
  if (isPrivilegedOwnerBypass(user)) return;

  const actorId = String(user?.id || user?.sub || user?.userId || '').trim();
  const actorEmail = String(user?.email || '').toLowerCase().trim();
  const actorName = String(user?.name || '').toLowerCase().trim();

  const ownerId = String(createdByUserId || '').trim();
  const ownerName = String(createdByName || '').toLowerCase().trim();

  // Nếu bản ghi chưa có thông tin người tạo thì không chặn legacy data, ngược lại phải khớp chủ sở hữu
  if (!ownerId && !ownerName) return;

  const idMatched = Boolean(ownerId && actorId && ownerId === actorId);
  const emailMatched = Boolean(ownerId && actorEmail && ownerId.toLowerCase() === actorEmail);
  const nameMatched = Boolean(ownerName && actorName && ownerName === actorName);

  if (!idMatched && !emailMatched && !nameMatched) {
    throw new ForbiddenException(
      `Bạn không có quyền ${actionLabel} của người khác. Chỉ người tạo, Super Admin hoặc Lớp trưởng mới được phép thao tác.`,
    );
  }
}
