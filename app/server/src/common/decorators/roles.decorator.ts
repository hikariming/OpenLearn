import { SetMetadata } from '@nestjs/common';

/**
 * 角色权限装饰器
 * 用于标记需要特定角色才能访问的路由
 * 
 * @param roles - 允许访问的角色列表
 * 
 * @example
 * ```typescript
 * @Post()
 * @Roles('admin', 'editor')
 * async create(@Body() data: CreateDto) {
 *   // 只有 admin 或 editor 角色可以访问
 * }
 * ```
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
