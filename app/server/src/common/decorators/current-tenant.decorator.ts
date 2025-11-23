import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 获取当前租户 ID 的装饰器
 * 从请求上下文中提取当前用户激活的租户 ID
 * 
 * @example
 * ```typescript
 * @Get()
 * async findAll(@CurrentTenant() tenantId: string) {
 *   return this.service.findAll(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string | undefined => {
        const request = ctx.switchToHttp().getRequest();
        return request.currentTenantId;
    },
);
