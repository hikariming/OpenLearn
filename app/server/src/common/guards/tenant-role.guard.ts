import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * 角色权限守卫
 * 验证用户在当前租户中的角色是否满足要求
 * 
 * 角色层级（从高到低）：
 * - owner: 所有者（创建者）
 * - admin: 管理员
 * - editor: 编辑者
 * - normal: 普通成员
 * 
 * 权限继承：高级别角色自动拥有低级别角色的权限
 */
@Injectable()
export class TenantRoleGuard implements CanActivate {
    private readonly logger = new Logger(TenantRoleGuard.name);

    // 角色层级定义
    private readonly roleHierarchy: Record<string, number> = {
        owner: 4,
        admin: 3,
        editor: 2,
        normal: 1,
    };

    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 获取路由所需的角色
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // 如果没有设置角色要求，允许访问
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userRole = request.currentRole;

        // 检查用户角色是否存在
        if (!userRole) {
            throw new ForbiddenException('无法确定您在该空间的角色');
        }

        // 检查用户角色是否满足要求
        const userRoleLevel = this.roleHierarchy[userRole] || 0;
        const hasPermission = requiredRoles.some((role) => {
            const requiredLevel = this.roleHierarchy[role] || 0;
            return userRoleLevel >= requiredLevel;
        });

        if (!hasPermission) {
            this.logger.warn(
                `User with role ${userRole} attempted to access resource requiring roles: ${requiredRoles.join(', ')}`,
            );
            throw new ForbiddenException(
                `权限不足，需要以下角色之一：${requiredRoles.join('、')}`,
            );
        }

        return true;
    }
}
