import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthorizationService } from './authorization.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('rbac')
export class AuthorizationController {
  constructor(
    private readonly authzService: AuthorizationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Lấy danh sách toàn bộ Vai trò (Roles)
   */
  @Get('roles')
  async getRoles() {
    return this.prisma.roles.findMany({
      orderBy: { created_at: 'asc' },
    });
  }

  /**
   * Lấy danh mục Quyền hạn (Permissions)
   */
  @Get('permissions')
  async getPermissions() {
    return this.prisma.permissions.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }

  /**
   * Lấy toàn bộ Ma trận Vai trò - Quyền hạn (Role Permissions Mapping)
   */
  @Get('matrix')
  async getRolePermissionsMatrix() {
    const roles = await this.prisma.roles.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'asc' },
    });

    const permissions = await this.prisma.permissions.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });

    const rolePerms = await this.prisma.role_permissions.findMany();

    // Group permissions by module
    const modulesMap: Record<string, any[]> = {};
    for (const p of permissions) {
      if (!modulesMap[p.module]) modulesMap[p.module] = [];
      modulesMap[p.module].push(p);
    }

    return {
      roles,
      permissions,
      modules: Object.keys(modulesMap).map((mod) => ({
        module: mod,
        permissions: modulesMap[mod],
      })),
      mappings: rolePerms,
    };
  }

  /**
   * Cập nhật Ma trận phân quyền (Cấp thêm hoặc thu hồi permission của một Role)
   */
  @Post('update-matrix')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async updateRolePermission(
    @Body() dto: { roleId: string; permissionId: string; enabled: boolean },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    if (dto.enabled) {
      await this.prisma.$executeRawUnsafe(`
        INSERT INTO public.role_permissions (id, role_id, permission_id, created_at)
        VALUES (gen_random_uuid(), $1::uuid, $2::uuid, NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, dto.roleId, dto.permissionId);

      await this.authzService.logAudit({
        actorId,
        action: 'GRANT_PERMISSION',
        targetType: 'ROLE_PERMISSION',
        targetId: `${dto.roleId}_${dto.permissionId}`,
        newValues: { roleId: dto.roleId, permissionId: dto.permissionId },
      });
    } else {
      await this.prisma.role_permissions.deleteMany({
        where: { role_id: dto.roleId, permission_id: dto.permissionId },
      });

      await this.authzService.logAudit({
        actorId,
        action: 'REVOKE_PERMISSION',
        targetType: 'ROLE_PERMISSION',
        targetId: `${dto.roleId}_${dto.permissionId}`,
        oldValues: { roleId: dto.roleId, permissionId: dto.permissionId },
      });
    }

    return { success: true };
  }

  /**
   * Lấy danh sách phân công chức vụ theo Scope của một User hoặc tất cả ('all')
   */
  @Get('user-assignments/:userId')
  async getUserAssignments(@Param('userId') userId: string) {
    return this.authzService.getUserRoleAssignments(userId);
  }

  /**
   * Gán chức vụ mới cho người dùng theo Scope (hỗ trợ cả userId/roleIdOrCode và userIdentifier/roleCode)
   */
  @Post('assign-role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async assignRole(
    @Body()
    dto: {
      userId?: string;
      userIdentifier?: string;
      roleIdOrCode?: string;
      roleCode?: string;
      scopeType?: string;
      scopeId?: string;
      startDate?: string;
      endDate?: string;
      notes?: string;
    },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return this.authzService.assignRole(actorId, {
      userId: dto.userId || dto.userIdentifier || '',
      roleIdOrCode: dto.roleIdOrCode || dto.roleCode || 'MEMBER',
      scopeType: dto.scopeType || 'ORGANIZATION',
      scopeId: dto.scopeId || 'all',
      startDate: dto.startDate,
      endDate: dto.endDate,
      notes: dto.notes,
    });
  }

  /**
   * Thu hồi chức vụ
   */
  @Post('revoke-assignment')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async revokeRoleAssignment(
    @Body() dto: { assignmentId: string; reason?: string },
    @Req() req: any,
  ) {
    const actorId = req.user?.id;
    return this.authzService.revokeRole(actorId, dto.assignmentId);
  }

  /**
   * Lấy quyền hạn hiệu lực thời gian thực của User đang đăng nhập
   */
  @Get('effective-permissions')
  @UseGuards(JwtAuthGuard)
  async getEffectivePermissions(@Req() req: any) {
    const userId = req.user?.id;
    return this.authzService.getEffectivePermissions(userId);
  }

  /**
   * Lấy danh sách Audit Log quản trị hệ thống
   */
  @Get('audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('platform_admin', 'admin')
  async getAuditLogs(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('action') action?: string,
  ) {
    const p = Math.max(1, parseInt(page, 10));
    const l = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (p - 1) * l;

    const where: any = {};
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      this.prisma.rbac_audit_logs.count({ where }),
      this.prisma.rbac_audit_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: l,
      }),
    ]);

    return {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      data: logs,
    };
  }
}
