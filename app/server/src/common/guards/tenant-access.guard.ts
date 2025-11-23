import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 租户访问守卫
 * 验证用户是否有权访问当前租户的资源
 * 
 * 功能：
 * 1. 检查用户是否已认证
 * 2. 检查租户上下文是否存在
 * 3. 验证用户是否属于该租户
 */
@Injectable()
export class TenantAccessGuard implements CanActivate {
    private readonly logger = new Logger(TenantAccessGuard.name);

    constructor(private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId = request.user?.id;
        let tenantId = request.currentTenantId;

        // 检查用户和租户上下文
        if (!userId) {
            throw new ForbiddenException('用户未认证');
        }

        // 如果中间件未能设置租户上下文（因为中间件在 AuthGuard 之前运行），尝试在此处加载
        if (!tenantId) {
            const currentMembership = await this.prisma.tenantMember.findFirst({
                where: {
                    userId,
                    current: true,
                },
            });

            if (currentMembership) {
                tenantId = currentMembership.tenantId;
                // 补全 request 上下文
                request.currentTenantId = tenantId;
                request.currentRole = currentMembership.role;
            }
        }

        if (!tenantId) {
            throw new ForbiddenException('租户上下文缺失，请先选择一个空间');
        }

        // 验证用户是否属于该租户
        const membership = await this.prisma.tenantMember.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });

        if (!membership) {
            this.logger.warn(
                `User ${userId} attempted to access tenant ${tenantId} without membership`,
            );
            throw new ForbiddenException('您不属于该空间');
        }

        return true;
    }
}
