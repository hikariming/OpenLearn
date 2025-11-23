import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 租户上下文中间件
 * 从用户的当前激活租户中提取租户信息并注入到请求上下文
 * 
 * 功能：
 * 1. 从 JWT 中获取用户 ID
 * 2. 查询用户当前激活的租户（current: true）
 * 3. 将租户信息注入到 request 对象中
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantContextMiddleware.name);

    constructor(private prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        const request = req as any;
        const userId = request.user?.id; // 从 JWT 认证中间件获取

        if (!userId) {
            // 未认证用户，跳过租户上下文设置
            return next();
        }

        try {
            // 获取用户当前激活的租户
            const currentMembership = await this.prisma.tenantMember.findFirst({
                where: {
                    userId,
                    current: true,
                },
                include: {
                    tenant: true,
                },
            });

            if (currentMembership) {
                // 注入租户信息到请求上下文
                request.currentTenant = currentMembership.tenant;
                request.currentTenantId = currentMembership.tenantId;
                request.currentRole = currentMembership.role;

                this.logger.debug(
                    `User ${userId} accessing with tenant ${currentMembership.tenantId} (${currentMembership.role})`,
                );
            } else {
                this.logger.warn(`User ${userId} has no active tenant`);
            }
        } catch (error) {
            this.logger.error(`Failed to load tenant context for user ${userId}`, error);
        }

        next();
    }
}
