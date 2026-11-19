import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const DATA_SCOPE_KEY = 'data_scope';

/**
 * Decorator to enforce required roles for controller classes or handlers.
 * Example: @Roles('admin', 'bqt', 'btt')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Decorator to enforce granular action permissions (Phân quyền thao tác).
 * Example: @RequirePermissions('MEM_DELETE', 'MEM_APPROVE')
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to enforce granular action permissions.
 * Example: @RequireActions('MEM_DELETE', 'FIN_COL_ADD')
 */
export const RequireActions = (...actions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, actions);

/**
 * Decorator to enforce required data scope (Phân quyền dữ liệu).
 * Example: @DataScopeLevel('DEPARTMENT') | @DataScopeLevel('ALL')
 */
export const DataScopeLevel = (level: 'ALL' | 'DEPARTMENT' | 'CLASS' | 'SELF') =>
  SetMetadata(DATA_SCOPE_KEY, level);
