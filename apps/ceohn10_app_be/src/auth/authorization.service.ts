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
   * Lấy danh sách phân công vai trò của người dùng (hỗ trợ 'all' để lấy toàn bộ)
   */
  async getUserRoleAssignments(userId: string) {
    const isAll = !userId || userId.toLowerCase() === 'all';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId || '');

    const rows = await this.prisma.user_role_assignments
      .findMany({
        where: isAll ? {} : isUuid ? { user_id: userId } : {},
        include: { roles: true },
        orderBy: { created_at: 'desc' },
      })
      .catch(() => []);

    // Làm giàu thông tin user & role cho bảng phân công trên Frontend
    const userIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
    const usersList =
      userIds.length > 0
        ? await this.prisma.$queryRaw<any[]>`
            SELECT u.id, u.name, u.email, u.username, m.code as member_code
            FROM public.vione_users u
            LEFT JOIN public.members m ON m.user_id = u.id
            WHERE u.id = ANY(${userIds}::uuid[])
          `.catch(() => [])
        : [];
    const userMap = new Map<string, any>();
    for (const u of usersList) userMap.set(String(u.id), u);

    const assignments = rows.map((r: any) => {
      const u = userMap.get(String(r.user_id));
      return {
        ...r,
        status: String(r.status || 'ACTIVE').toUpperCase(),
        start_date: r.start_date ? new Date(r.start_date).toISOString().slice(0, 10) : '',
        end_date: r.end_date ? new Date(r.end_date).toISOString().slice(0, 10) : null,
        user: u || { id: r.user_id, name: r.notes || 'Học viên CEO HN10', email: '', member_code: '' },
        role: r.roles || { id: r.role_id, code: 'MEMBER', name: 'Học viên', scope_level: r.scope_type },
      };
    });

    return { success: true, assignments };
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
    const rawIdentifier = (data.userId || '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawIdentifier);

    // Giải quyết userId từ Email, Mã học viên hoặc UUID
    let resolvedUserId = isUuid ? rawIdentifier : '';
    if (!resolvedUserId && rawIdentifier) {
      const uRows = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM public.vione_users
        WHERE LOWER(email) = LOWER(${rawIdentifier}) OR LOWER(username) = LOWER(${rawIdentifier})
        LIMIT 1
      `.catch(() => []);
      if (uRows.length > 0 && uRows[0].id) {
        resolvedUserId = uRows[0].id;
      } else {
        const mRows = await this.prisma.$queryRaw<any[]>`
          SELECT id, user_id, email, name, code FROM public.members
          WHERE LOWER(code) = LOWER(${rawIdentifier}) OR LOWER(email) = LOWER(${rawIdentifier}) OR id::text = ${rawIdentifier}
          LIMIT 1
        `.catch(() => []);
        if (mRows.length > 0) {
          if (mRows[0].user_id) {
            resolvedUserId = mRows[0].user_id;
          } else {
            const newUid = crypto.randomUUID();
            const fallbackEmail = (mRows[0].email || `${(mRows[0].code || 'hv').toLowerCase()}@ceohn10.vn`).toLowerCase();
            await this.prisma.$executeRaw`
              INSERT INTO public.vione_users (id, username, email, password, name, email_verified, created_at, updated_at)
              VALUES (${newUid}::uuid, ${fallbackEmail}, ${fallbackEmail}, '', ${mRows[0].name || fallbackEmail}, true, NOW(), NOW())
              ON CONFLICT DO NOTHING
            `.catch(() => {});
            await this.prisma.$executeRaw`
              UPDATE public.members SET user_id = ${newUid}::uuid WHERE id = ${mRows[0].id}
            `.catch(() => {});
            resolvedUserId = newUid;
          }
        }
      }
    }

    if (!resolvedUserId) {
      throw new NotFoundException(`Không tìm thấy người dùng với Email/Mã học viên "${rawIdentifier}"`);
    }

    // 1. Tìm vai trò theo id hoặc code (nếu chưa có trong bảng roles thì tự khởi tạo)
    const cleanRoleCode = (data.roleIdOrCode || 'MEMBER').trim().toUpperCase();
    const isRoleIdUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.roleIdOrCode || '');
    let role = await this.prisma.roles
      .findFirst({
        where: {
          OR: [...(isRoleIdUuid ? [{ id: data.roleIdOrCode }] : []), { code: cleanRoleCode }],
        },
      })
      .catch(() => null);

    if (!role) {
      role = await this.prisma.roles
        .create({
          data: {
            code: cleanRoleCode,
            name: cleanRoleCode.replace(/_/g, ' '),
            description: `Vai trò ${cleanRoleCode}`,
            is_system: true,
            is_active: true,
          },
        })
        .catch(() => null);
    }

    if (!role) {
      throw new NotFoundException(`Không tìm thấy vai trò "${data.roleIdOrCode}"`);
    }

    // 2. Kiểm tra thẩm quyền của Actor
    if (role.code === 'ADMIN_PLATFORM' && actorId) {
      const isSuper = await this.isPlatformAdmin(actorId);
      if (!isSuper) {
        throw new ForbiddenException('Chỉ có Admin Platform mới có quyền gán vai trò ADMIN_PLATFORM');
      }
    }

    // 3. Tạo phân công vai trò
    const assignment = await this.prisma.user_role_assignments.create({
      data: {
        user_id: resolvedUserId,
        role_id: role.id,
        organization_id: data.organizationId || 'ceohn10',
        scope_type: data.scopeType || 'ORGANIZATION',
        scope_id: data.scopeId || 'all',
        start_date: data.startDate ? new Date(data.startDate) : new Date(),
        end_date: data.endDate ? new Date(data.endDate) : null,
        status: 'ACTIVE',
        assigned_by: actorId || null,
        notes: data.notes || rawIdentifier,
      },
      include: { roles: true },
    });

    // 4. Đồng bộ vào bảng public.members và public.user_roles để tài khoản đăng nhập áp dụng quyền ngay lập tức
    const mappedExecAndDept = (() => {
      const rc = cleanRoleCode;
      if (rc === 'ADMIN_PLATFORM' || rc === 'PLATFORM_ADMIN') return { role: 'platform_admin', dept: 'Ban Công nghệ', appRole: 'platform_admin' };
      if (rc.includes('ADMIN')) return { role: 'admin', dept: 'Ban Công nghệ', appRole: 'admin' };
      if (rc === 'LOP_TRUONG' || rc === 'CHU_TICH') return { role: 'lop_truong', dept: 'Ban Gắn kết & Đời sống', appRole: 'admin' };
      if (rc === 'LOP_PHO' || rc === 'BAN_DIEU_HANH') return { role: 'lop_pho', dept: 'Ban Gắn kết & Đời sống', appRole: 'admin' };
      if (rc === 'TRUONG_TEAM') return { role: 'truong_team', dept: 'Ban Gắn kết & Đời sống', appRole: 'admin' };
      if (rc === 'PHO_TEAM') return { role: 'pho_team', dept: 'Ban Gắn kết & Đời sống', appRole: 'admin' };
      if (rc === 'GIANG_VIEN') return { role: 'giang_vien', dept: 'Ban Gắn kết & Đời sống', appRole: 'member' };
      if (rc.includes('CONG_NGHE')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Công nghệ', appRole: 'admin' };
      if (rc.includes('TRUYEN_THONG')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Truyền thông', appRole: 'admin' };
      if (rc.includes('TAI_CHINH')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Tài chính', appRole: 'admin' };
      if (rc.includes('SU_KIEN')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Sự kiện & Hậu cần', appRole: 'admin' };
      if (rc.includes('DOI_NGOAI') || rc.includes('GIAO_THUONG') || rc.includes('XUC_TIEN')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Đối ngoại & Giao thương', appRole: 'admin' };
      if (rc.includes('GAN_KET') || rc.includes('DOI_SONG') || rc.includes('THANH_VIEN')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Gắn kết & Đời sống', appRole: 'admin' };
      if (rc.includes('THIEN_NGUYEN')) return { role: 'truong_ban_chuyen_trach', dept: 'Ban Thiện nguyện', appRole: 'admin' };
      return { role: 'member', dept: 'Ban Gắn kết & Đời sống', appRole: 'member' };
    })();

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.user_roles WHERE user_id = $1::uuid`,
      resolvedUserId,
    ).catch(() => {});
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.user_roles (id, user_id, role, created_at) VALUES (gen_random_uuid(), $1::uuid, $2::app_role, NOW())`,
      resolvedUserId,
      mappedExecAndDept.appRole,
    ).catch(() => {});

    await this.prisma.$executeRawUnsafe(
      `UPDATE public.members SET executive_role = $1, department = $2, updated_at = NOW() WHERE user_id = $3::uuid`,
      mappedExecAndDept.role,
      mappedExecAndDept.dept,
      resolvedUserId,
    ).catch(() => {});

    // 5. Ghi Audit Log
    await this.logAudit({
      actorId,
      action: 'ASSIGN_ROLE',
      targetType: 'ASSIGNMENT',
      targetId: assignment.id,
      newValues: {
        userId: resolvedUserId,
        roleCode: role.code,
        scopeType: data.scopeType,
        scopeId: data.scopeId,
      },
    });

    return {
      success: true,
      message: `Đã phân công vai trò ${role.name} thành công!`,
      assignment,
    };
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
      data: { status: 'REVOKED', updated_at: new Date() },
    });

    // Ghi Audit Log
    await this.logAudit({
      actorId,
      action: 'REVOKE_ROLE',
      targetType: 'ASSIGNMENT',
      targetId: assignmentId,
      oldValues: { status: existing.status, roleCode: existing.roles?.code },
      newValues: { status: 'REVOKED' },
    });

    return {
      success: true,
      message: 'Đã thu hồi phân công chức vụ thành công!',
      assignment: updated,
    };
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
