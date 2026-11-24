import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface UserEffectiveScope {
  roleCode: string;
  roleName: string;
  scopeType: 'PLATFORM' | 'ORGANIZATION' | 'CLASS' | 'TEAM' | 'COMMITTEE' | 'SELF';
  scopeId: string;
  startDate?: string;
  endDate?: string;
  permissions: string[];
}

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Kiểm tra quyền hạn của người dùng (có xét Scope Type & Scope ID)
   */
  async hasPermission(
    userId: string,
    permissionCode: string,
    scopeType?: string,
    scopeId?: string,
  ): Promise<boolean> {
    if (!userId) return false;

    // 1. Kiểm tra Admin Platform tối cao
    const isPlatformAdmin = await this.isPlatformAdmin(userId);
    if (isPlatformAdmin) return true;

    // 2. Tra cứu danh sách phân công vai trò còn hiệu lực của người dùng
    const assignments = await this.getUserActiveAssignments(userId);
    if (!assignments || assignments.length === 0) {
      return false;
    }

    const cleanPermCode = permissionCode.toLowerCase().trim();

    for (const assign of assignments) {
      // Kiểm tra xem Role của assignment này có permissionCode không
      const rolePerms = await this.getPermissionsByRoleId(assign.role_id);
      const hasPerm = rolePerms.some((p) => p.toLowerCase().trim() === cleanPermCode || p === '*');

      if (!hasPerm) continue;

      // Nếu không yêu cầu kiểm tra Scope -> Đạt
      if (!scopeType && !scopeId) return true;

      // Nếu Role có Scope là PLATFORM hoặc ORGANIZATION -> Đạt cho mọi Scope con
      if (assign.scope_type === 'PLATFORM' || assign.scope_type === 'ORGANIZATION') {
        return true;
      }

      // Kiểm tra Scope Type và Scope ID tương ứng
      if (scopeType && assign.scope_type === scopeType) {
        if (!scopeId || assign.scope_id === 'all' || assign.scope_id === scopeId) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Kiểm tra người dùng có một Role cụ thể không
   */
  async hasRole(userId: string, roleCode: string): Promise<boolean> {
    if (!userId) return false;
    const cleanRole = roleCode.toUpperCase().trim();
    if (cleanRole === 'ADMIN_PLATFORM' && (await this.isPlatformAdmin(userId))) {
      return true;
    }

    const assignments = await this.getUserActiveAssignments(userId);
    return assignments.some((a) => (a.roles?.code || '').toUpperCase().trim() === cleanRole);
  }

  /**
   * Kiểm tra quyền truy cập vào Scope dữ liệu
   */
  async hasScopeAccess(userId: string, scopeType: string, scopeId: string): Promise<boolean> {
    if (!userId) return false;
    if (await this.isPlatformAdmin(userId)) return true;

    const assignments = await this.getUserActiveAssignments(userId);
    for (const a of assignments) {
      if (a.scope_type === 'PLATFORM' || a.scope_type === 'ORGANIZATION') return true;
      if (a.scope_type === scopeType) {
        if (a.scope_id === 'all' || a.scope_id === scopeId) return true;
      }
    }

    return false;
  }

  /**
   * Lấy toàn bộ quyền hạn hiệu lực (Effective Permissions) của người dùng thời gian thực
   */
  async getEffectivePermissions(userId: string): Promise<{
    isPlatformAdmin: boolean;
    roles: string[];
    permissions: string[];
    scopes: UserEffectiveScope[];
  }> {
    if (!userId) {
      return { isPlatformAdmin: false, roles: [], permissions: [], scopes: [] };
    }

    const isPlatformAdmin = await this.isPlatformAdmin(userId);
    const assignments = await this.getUserActiveAssignments(userId);

    const rolesSet = new Set<string>();
    const permissionsSet = new Set<string>();
    const scopes: UserEffectiveScope[] = [];

    if (isPlatformAdmin) {
      rolesSet.add('ADMIN_PLATFORM');
      permissionsSet.add('*');
    }

    for (const a of assignments) {
      const roleCode = (a.roles?.code || '').toUpperCase().trim();
      const roleName = a.roles?.name || roleCode;
      rolesSet.add(roleCode);

      const perms = await this.getPermissionsByRoleId(a.role_id);
      perms.forEach((p) => permissionsSet.add(p));

      scopes.push({
        roleCode,
        roleName,
        scopeType: a.scope_type as any,
        scopeId: a.scope_id,
        startDate: a.start_date ? a.start_date.toISOString().slice(0, 10) : undefined,
        endDate: a.end_date ? a.end_date.toISOString().slice(0, 10) : undefined,
        permissions: perms,
      });
    }

    return {
      isPlatformAdmin,
      roles: Array.from(rolesSet),
      permissions: Array.from(permissionsSet),
      scopes,
    };
  }

  /**
   * Lấy danh sách phân công vai trò của người dùng
   */
  async getUserRoleAssignments(userId: string) {
    return this.prisma.user_role_assignments.findMany({
      where: { user_id: userId },
      include: { roles: true },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Gán chức vụ mới cho người dùng theo Scope
   */
  async assignRole(actorId: string | undefined, data: {
    userId: string;
    roleIdOrCode: string;
    scopeType: string;
    scopeId: string;
    organizationId?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
  }) {
    // 1. Tìm vai trò theo id hoặc code
    let role = await this.prisma.roles.findFirst({
      where: {
        OR: [{ id: data.roleIdOrCode }, { code: data.roleIdOrCode.toUpperCase() }],
      },
    });

    if (!role) {
      throw new NotFoundException(`Không tìm thấy vai trò "${data.roleIdOrCode}"`);
    }

    // 2. Kiểm tra thẩm quyền của Actor: Admin thường không được tự gán ADMIN_PLATFORM
    if (role.code === 'ADMIN_PLATFORM' && actorId) {
      const isSuper = await this.isPlatformAdmin(actorId);
      if (!isSuper) {
        throw new ForbiddenException('Chỉ có Admin Platform mới có quyền gán vai trò ADMIN_PLATFORM');
      }
    }

    // 3. Tạo phân công vai trò
    const assignment = await this.prisma.user_role_assignments.create({
      data: {
        user_id: data.userId,
        role_id: role.id,
        organization_id: data.organizationId || 'ceohn10',
        scope_type: data.scopeType || 'ORGANIZATION',
        scope_id: data.scopeId || 'all',
        start_date: data.startDate ? new Date(data.startDate) : new Date(),
        end_date: data.endDate ? new Date(data.endDate) : null,
        status: 'active',
        assigned_by: actorId || null,
        notes: data.notes || '',
      },
      include: { roles: true },
    });

    // 4. Đồng bộ vào bảng user_roles legacy để tương thích ngược
    await this.prisma.$executeRawUnsafe(`
      INSERT INTO public.user_roles (id, user_id, role, created_at)
      VALUES (gen_random_uuid(), $1::uuid, $2, NOW())
      ON CONFLICT (user_id, role) DO NOTHING
    `, data.userId, role.code.toLowerCase()).catch(() => {});

    // 5. Ghi Audit Log
    await this.logAudit({
      actorId,
      action: 'ASSIGN_ROLE',
      targetType: 'ASSIGNMENT',
      targetId: assignment.id,
      newValues: {
        userId: data.userId,
        roleCode: role.code,
        scopeType: data.scopeType,
        scopeId: data.scopeId,
      },
    });

    return assignment;
  }

  /**
   * Thu hồi vai trò phân công
   */
  async revokeRole(actorId: string | undefined, assignmentId: string) {
    const existing = await this.prisma.user_role_assignments.findUnique({
      where: { id: assignmentId },
      include: { roles: true },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy bản ghi phân công vai trò');
    }

    const updated = await this.prisma.user_role_assignments.update({
      where: { id: assignmentId },
      data: { status: 'revoked', updated_at: new Date() },
    });

    // Ghi Audit Log
    await this.logAudit({
      actorId,
      action: 'REVOKE_ROLE',
      targetType: 'ASSIGNMENT',
      targetId: assignmentId,
      oldValues: { status: existing.status, roleCode: existing.roles?.code },
      newValues: { status: 'revoked' },
    });

    return updated;
  }

  /**
   * Ghi Audit Log tập trung cho toàn hệ thống
   */
  async logAudit(data: {
    actorId?: string;
    action: string;
    targetType: string;
    targetId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.rbac_audit_logs.create({
        data: {
          actor_id: data.actorId || null,
          action: data.action,
          target_type: data.targetType,
          target_id: data.targetId || null,
          old_values: data.oldValues || {},
          new_values: data.newValues || {},
          ip_address: data.ipAddress || null,
          user_agent: data.userAgent || null,
        },
      });
    } catch (err) {
      this.logger.warn(`Lỗi ghi audit log: ${err}`);
    }
  }

  // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

  private async isPlatformAdmin(userId: string): Promise<boolean> {
    if (!userId) return false;
    if (
      userId === '00000000-0000-0000-0000-000000000000' ||
      userId === '00000000-0000-4000-8000-000000000001'
    ) {
      return true;
    }

    // Kiểm tra trong user_role_assignments
    const count = await this.prisma.user_role_assignments.count({
      where: {
        user_id: userId,
        status: 'active',
        roles: { code: 'ADMIN_PLATFORM' },
      },
    });

    if (count > 0) return true;

    // Kiểm tra email đặc quyền
    const user = await this.prisma.vione_users.findUnique({
      where: { id: userId },
      select: { email: true, username: true },
    });

    const cleanEmail = (user?.email || user?.username || '').toLowerCase().trim();
    return (
      cleanEmail === 'admin@ceohn10.vn' ||
      cleanEmail === 'admin@viconnect.vn' ||
      cleanEmail === 'admin@connect.vn' ||
      cleanEmail === 'ceo.chutich@ceohn10.com'
    );
  }

  private async getUserActiveAssignments(userId: string) {
    const now = new Date();
    return this.prisma.user_role_assignments.findMany({
      where: {
        user_id: userId,
        status: 'active',
        OR: [{ end_date: null }, { end_date: { gte: now } }],
      },
      include: { roles: true },
    });
  }

  private async getPermissionsByRoleId(roleId: string): Promise<string[]> {
    const rows = await this.prisma.role_permissions.findMany({
      where: { role_id: roleId },
      include: { permissions: true },
    });
    return rows.map((r) => r.permissions.code);
  }
}
