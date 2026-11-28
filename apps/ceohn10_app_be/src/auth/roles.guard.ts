import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMISSIONS_KEY, DATA_SCOPE_KEY } from './roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface UserDataScope {
  level: 'ALL' | 'DEPARTMENT' | 'CLASS' | 'SELF';
  userId: string;
  email: string;
  department?: string;
  memberId?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    const requiredDataScope = this.reflector.getAllAndOverride<string>(
      DATA_SCOPE_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Nếu không có bất kỳ yêu cầu bảo vệ nào và không có user, cho phép đi tiếp
    if (!requiredRoles?.length && !requiredPermissions?.length && !requiredDataScope && !user) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException(
        'Yêu cầu xác thực tài khoản trước khi thực hiện thao tác này',
      );
    }

    // 1. Kiểm tra vai trò thời gian thực trực tiếp từ CSDL (Realtime DB Authorization)
    const dbRoles: string[] = [];
    let userDepartment: string | undefined = undefined;
    let userMemberId: string | undefined = undefined;

    if (user.id) {
      try {
        const urRows = await this.prisma.$queryRaw<any[]>`
          SELECT role::text FROM public.user_roles WHERE user_id = ${user.id}::uuid
        `.catch(() => []);
        dbRoles.push(...urRows.map((r) => r.role));

        const memRows = await this.prisma.$queryRaw<any[]>`
          SELECT role::text FROM public.memberships WHERE user_id = ${user.id}::uuid
        `.catch(() => []);
        dbRoles.push(...memRows.map((r) => r.role));

        // Kiểm tra vai trò ban điều hành & chức vụ trong bảng members
        const memberRows = await this.prisma.$queryRaw<any[]>`
          SELECT id::text, executive_role::text, department::text, status::text, card_visibility_settings
          FROM public.members 
          WHERE user_id = ${user.id}::uuid OR id::text = ${user.id}::text 
          LIMIT 1
        `.catch(() => []);
        if (memberRows.length > 0) {
          const m = memberRows[0];
          userMemberId = m.id;
          if (m.executive_role) dbRoles.push(m.executive_role);
          if (m.department) {
            userDepartment = m.department;
            dbRoles.push(m.department);
          }
          if (
            m.card_visibility_settings &&
            typeof m.card_visibility_settings === 'object' &&
            Array.isArray((m.card_visibility_settings as any).customPermissions)
          ) {
            (request as any).dbCustomPermissions = (m.card_visibility_settings as any).customPermissions;
          }
          // Nếu Học viên bị đình chỉ hoặc vô hiệu hóa trong DB, lập tức chặn
          if (
            m.status === 'suspended' ||
            m.status === 'inactive' ||
            m.status === 'banned'
          ) {
            throw new ForbiddenException(
              'Tài khoản của bạn đã bị tạm khóa hoặc thu hồi quyền truy cập. Vui lòng liên hệ Ban Điều Hành.',
            );
          }
        }

        const vUsers = await this.prisma
          .$queryRaw<any[]>`
          SELECT email, username, role, status FROM public.ceohn10_users WHERE id = ${user.id}::uuid LIMIT 1
        `
          .catch(() =>
            this.prisma.$queryRaw<any[]>`
          SELECT email, username, role, status FROM public.vione_users WHERE id = ${user.id}::uuid LIMIT 1
        `,
          )
          .catch(() => []);
        if (vUsers.length > 0) {
          const vu = vUsers[0];
          if (
            vu.status === 'inactive' ||
            vu.status === 'suspended' ||
            vu.status === 'banned'
          ) {
            throw new ForbiddenException(
              'Tài khoản của bạn đã bị vô hiệu hóa bởi Quản trị viên.',
            );
          }
          if (vu.role) dbRoles.push(vu.role);
          const cleanEmail = (vu.email || '').toLowerCase().trim();
          const cleanUsername = (vu.username || '').toLowerCase().trim();
          if (
            cleanEmail === 'admin@ceohn10.vn' ||
            cleanUsername === 'admin@ceohn10.vn' ||
            cleanEmail === 'admin@viconnect.vn' ||
            cleanUsername === 'admin@viconnect.vn' ||
            cleanEmail === 'admin@connect.vn' ||
            cleanUsername === 'admin@connect.vn' ||
            cleanEmail === 'ceo.chutich@ceohn10.com'
          ) {
            dbRoles.push('admin', 'platform_admin', 'adm', 'quan_tri');
          }
        }
      } catch (err) {
        if (err instanceof ForbiddenException) throw err;
        console.warn('[RolesGuard] Realtime DB roles query error:', err);
      }
    }

    // 2. Kết hợp vai trò từ CSDL và JWT payload
    const effectiveRoles: string[] = [...dbRoles];
    if (Array.isArray(user.roles)) effectiveRoles.push(...user.roles);
    if (user.role) effectiveRoles.push(user.role);
    if (user.srsRole) effectiveRoles.push(user.srsRole);
    if (user.executiveRole) effectiveRoles.push(user.executiveRole);

    const userEmail = String(user.email || user.username || '')
      .toLowerCase()
      .trim();
    if (
      userEmail === 'admin@ceohn10.vn' ||
      userEmail === 'admin@viconnect.vn' ||
      userEmail === 'admin@connect.vn' ||
      userEmail === 'ceo.chutich@ceohn10.com'
    ) {
      effectiveRoles.push('admin', 'platform_admin', 'adm', 'chu_tich', 'bqt', 'quan_tri');
    }

    const normalizedUserRoles = effectiveRoles.map((r) =>
      String(r).toLowerCase().trim(),
    );

    const dbCustomPerms: string[] = Array.isArray((request as any).dbCustomPermissions)
      ? (request as any).dbCustomPermissions
      : [];
    const hasCustomPerms = dbCustomPerms.length > 0;

    const isSuperAdmin =
      !hasCustomPerms &&
      (userEmail === 'admin@ceohn10.vn' ||
        normalizedUserRoles.includes('platform_admin'));

    // 3. Phân quyền Dữ Liệu (Data Scope Resolution)
    let scopeLevel: 'ALL' | 'DEPARTMENT' | 'CLASS' | 'SELF' = 'SELF';
    if (
      isSuperAdmin ||
      normalizedUserRoles.includes('admin') ||
      normalizedUserRoles.includes('lop_truong') ||
      normalizedUserRoles.includes('lop_pho')
    ) {
      scopeLevel = 'ALL';
    } else if (
      normalizedUserRoles.includes('truong_team') ||
      normalizedUserRoles.includes('pho_team') ||
      normalizedUserRoles.some((r) => r.startsWith('truong_ban_')) ||
      userDepartment
    ) {
      scopeLevel = 'DEPARTMENT';
    } else if (normalizedUserRoles.includes('giang_vien')) {
      scopeLevel = 'CLASS';
    }

    const dataScope: UserDataScope = {
      level: scopeLevel,
      userId: user.id,
      email: userEmail,
      department: userDepartment,
      memberId: userMemberId,
    };
    request.dataScope = dataScope;

    // Kiểm tra yêu cầu Data Scope nếu có
    if (requiredDataScope) {
      if (requiredDataScope === 'ALL' && scopeLevel !== 'ALL') {
        throw new ForbiddenException(
          'Thao tác này yêu cầu quyền dữ liệu phạm vi Toàn Hệ Thống (Master Admin / Chủ Tịch)',
        );
      }
      if (requiredDataScope === 'DEPARTMENT' && scopeLevel === 'SELF') {
        throw new ForbiddenException(
          'Thao tác này yêu cầu quyền dữ liệu phạm vi Ban Chuyên Môn',
        );
      }
    }

    // SuperAdmin không bị giới hạn bởi customPermissions thì bypass
    if (isSuperAdmin) {
      return true;
    }

    // 3.5. Nếu tài khoản có gán customPermissions (Tích quyền cụ thể), chặn ngay lập tức nếu request nằm ngoài quyền đã tích
    let matchedAllowedModule = false;
    if (hasCustomPerms) {
      const reqPath = String(request.path || request.url || '').split('?')[0].toLowerCase();
      const allowedModuleChecks: Array<{ apiPrefix: string; permMatch: string[] }> = [
        { apiPrefix: '/api/members', permMatch: ['/members', 'MEM_'] },
        { apiPrefix: '/api/events', permMatch: ['/events', '/event-registrations', '/event-checkin', '/checkin-qr', '/lucky-draw', 'EVT_', 'EREG_', 'CHK_', 'LKD_'] },
        { apiPrefix: '/api/trainings', permMatch: ['/classes', 'CLS_', 'TRN_'] },
        { apiPrefix: '/api/sponsors', permMatch: ['/sponsors', '/finance-report', 'SPN_', 'FIN_'] },
        { apiPrefix: '/api/finance-init', permMatch: ['/finance-report', 'FIN_'] },
        { apiPrefix: '/api/financial-report', permMatch: ['/finance-report', 'FIN_'] },
        { apiPrefix: '/api/documents', permMatch: ['/documents', 'DOC_'] },
        { apiPrefix: '/api/voting', permMatch: ['/voting', '/events', 'VOTE_'] },
        { apiPrefix: '/api/polls', permMatch: ['/voting', '/polls', '/events', 'VOTE_'] },
        { apiPrefix: '/api/admin/landing-webs', permMatch: ['/admin/landing-webs', '/landing-builder', 'LND_', 'LANDING_'] },
        { apiPrefix: '/api/admin', permMatch: ['/master'] },
        { apiPrefix: '/api/rbac', permMatch: ['/permissions', '/accounts'] },
        { apiPrefix: '/api/users', permMatch: ['/accounts', '/permissions'] },
        { apiPrefix: '/api/settings', permMatch: ['/settings'] },
      ];
      const isSelfEndpoint =
        reqPath.includes('/me') ||
        reqPath.includes('/my-') ||
        reqPath.includes('/directory') ||
        reqPath.includes('/account-statuses');

      if (!isSelfEndpoint) {
        for (const mod of allowedModuleChecks) {
          if (reqPath.startsWith(mod.apiPrefix) || reqPath.startsWith(mod.apiPrefix.replace('/api', ''))) {
            const hasModulePerm = dbCustomPerms.some((cp) =>
              mod.permMatch.some((pm) => cp === pm || cp.startsWith(pm)),
            );
            if (!hasModulePerm) {
              throw new ForbiddenException(
                'Tài khoản của bạn không được phân quyền thao tác trên phân hệ này.',
              );
            }
            matchedAllowedModule = true;
          }
        }
      }
    }

    // 4. Kiểm tra Phân Quyền Chức Năng (Roles / Functional Permissions)
    let roleGranted = true;
    if (requiredRoles && requiredRoles.length > 0) {
      roleGranted = requiredRoles.some((role) =>
        normalizedUserRoles.includes(role.toLowerCase().trim()),
      );
      if (
        !roleGranted &&
        hasCustomPerms &&
        normalizedUserRoles.includes('custom_account') &&
        matchedAllowedModule
      ) {
        roleGranted = true;
      }
    }

    // 5. Kiểm tra Phân Quyền Thao Tác (Action Permissions)
    let actionGranted = true;
    const actionsToCheck = requiredPermissions || [];

    if (actionsToCheck.length > 0) {
      const userPerms: string[] = Array.isArray(user.permissions)
        ? user.permissions.map((p: any) => String(p).toLowerCase().trim())
        : [];

      if (userPerms.includes('*')) {
        actionGranted = true;
      } else {
        actionGranted = actionsToCheck.some((act) =>
          userPerms.includes(act.toLowerCase().trim()),
        );

        if (!actionGranted) {
          try {
            const matrixRows = await this.prisma.$queryRaw<{ value: any }[]>`
              SELECT value FROM public.app_settings WHERE key = 'crm_permission_matrix' LIMIT 1
            `.catch(() => []);
            if (matrixRows.length > 0 && matrixRows[0]?.value) {
              const val = matrixRows[0].value;
              const categories =
                val.categories || val.rows || (Array.isArray(val) ? val : []);
              if (Array.isArray(categories)) {
                for (const cat of categories) {
                  if (actionGranted) break;
                  if (!cat?.features || !Array.isArray(cat.features)) continue;
                  for (const feat of cat.features) {
                    if (actionGranted) break;
                    if (!feat?.actions || !Array.isArray(feat.actions)) continue;
                    for (const act of feat.actions) {
                      const actCode = String(act.code || act.id || '')
                        .toLowerCase()
                        .trim();
                      const matchesReq = actionsToCheck.some(
                        (req) =>
                          req.toLowerCase().trim() === actCode ||
                          actCode.includes(req.toLowerCase().trim()),
                      );
                      if (matchesReq && act.roles) {
                        const isGranted = normalizedUserRoles.some(
                          (r) => act.roles[r] === true,
                        );
                        if (isGranted) {
                          actionGranted = true;
                          break;
                        }
                      }
                    }
                  }
                }
              }
            }
          } catch { }
        }
      }
    }

    if (!roleGranted || !actionGranted) {
      const needed = [
        ...(requiredRoles || []),
        ...(actionsToCheck || []),
      ].join(', ');
      throw new ForbiddenException(
        `Quyền hạn của bạn không đủ để thực hiện thao tác này (yêu cầu phân quyền: ${needed || 'Quản trị viên'})`,
      );
    }

    return true;
  }
}
