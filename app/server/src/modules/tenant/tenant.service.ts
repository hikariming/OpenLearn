import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantService {
    constructor(private prisma: PrismaService) { }

    /**
     * 获取单个租户信息
     */
    async tenant(
        tenantWhereUniqueInput: Prisma.TenantWhereUniqueInput,
    ): Promise<Tenant | null> {
        return this.prisma.tenant.findUnique({
            where: tenantWhereUniqueInput,
        });
    }

    /**
     * 获取租户列表
     */
    async tenants(params: {
        skip?: number;
        take?: number;
        cursor?: Prisma.TenantWhereUniqueInput;
        where?: Prisma.TenantWhereInput;
        orderBy?: Prisma.TenantOrderByWithRelationInput;
    }): Promise<Tenant[]> {
        const { skip, take, cursor, where, orderBy } = params;
        return this.prisma.tenant.findMany({
            skip,
            take,
            cursor,
            where,
            orderBy,
        });
    }

    /**
     * 获取用户的所有租户（包含成员信息）
     */
    async getUserTenants(userId: string) {
        const memberships = await this.prisma.tenantMember.findMany({
            where: { userId },
            include: {
                tenant: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return memberships.map((membership) => ({
            id: membership.tenant.id,
            name: membership.tenant.name,
            plan: membership.tenant.plan,
            status: membership.tenant.status,
            role: membership.role,
            current: membership.current,
            createdAt: membership.tenant.createdAt,
            memberCount: 0, // 需要额外查询，暂时返回 0
        }));
    }

    /**
     * 创建租户（同时添加创建者为 owner）
     */
    async createTenant(userId: string, name: string): Promise<Tenant> {
        try {
            console.log('[TenantService] Creating tenant for user:', userId);
            console.log('[TenantService] Tenant name:', name);

            return await this.prisma.$transaction(async (tx) => {
                // 1. 创建租户
                console.log('[TenantService] Step 1: Creating tenant...');
                const tenant = await tx.tenant.create({
                    data: {
                        name,
                        ownerId: userId,
                        plan: 'basic',
                        status: 'normal',
                    },
                });
                console.log('[TenantService] Tenant created:', tenant.id);

                // 2. 将所有现有租户设置为非当前
                console.log('[TenantService] Step 2: Updating existing tenants...');
                const updateResult = await tx.tenantMember.updateMany({
                    where: { userId },
                    data: { current: false },
                });
                console.log('[TenantService] Updated tenants count:', updateResult.count);

                // 3. 添加创建者为 owner，并设置为当前租户
                console.log('[TenantService] Step 3: Creating tenant member...');
                await tx.tenantMember.create({
                    data: {
                        tenantId: tenant.id,
                        userId,
                        role: 'owner',
                        current: true,
                    },
                });
                console.log('[TenantService] Tenant member created successfully');

                return tenant;
            });
        } catch (error) {
            console.error('[TenantService] Error creating tenant:', error);
            console.error('[TenantService] Error stack:', error.stack);
            throw error;
        }
    }

    /**
     * 更新租户信息
     */
    async updateTenant(
        tenantId: string,
        data: any,
    ) {
        return this.prisma.tenant.update({
            where: { id: tenantId },
            data,
        });
    }

    /**
     * 删除租户（只有 owner 可以删除）
     */
    async deleteTenant(tenantId: string): Promise<void> {
        await this.prisma.$transaction([
            // 1. 删除所有成员关系
            this.prisma.tenantMember.deleteMany({
                where: { tenantId },
            }),
            // 2. 删除租户
            this.prisma.tenant.delete({
                where: { id: tenantId },
            }),
        ]);
    }

    /**
     * 添加成员
     */
    async addMember(data: Prisma.TenantMemberCreateInput): Promise<TenantMember> {
        return this.prisma.tenantMember.create({
            data,
        });
    }

    /**
     * 获取成员信息
     */
    async getMember(
        tenantId: string,
        userId: string,
    ): Promise<TenantMember | null> {
        return this.prisma.tenantMember.findUnique({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });
    }

    /**
     * 获取租户的所有成员
     */
    async getTenantMembers(tenantId: string) {
        return this.prisma.tenantMember.findMany({
            where: { tenantId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    /**
     * 邀请成员（通过邮箱）
     */
    async inviteMember(
        tenantId: string,
        email: string,
        role: string,
        invitedBy: string,
    ): Promise<TenantMember> {
        // 1. 查找用户
        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 2. 检查是否已经是成员
        const existingMember = await this.getMember(tenantId, user.id);
        if (existingMember) {
            throw new BadRequestException('该用户已经是空间成员');
        }

        // 3. 添加成员
        return this.addMember({
            tenant: { connect: { id: tenantId } },
            user: { connect: { id: user.id } },
            role,
            invitedBy,
        });
    }

    /**
     * 更新成员角色
     */
    async updateMemberRole(
        tenantId: string,
        userId: string,
        role: string,
    ): Promise<TenantMember> {
        const member = await this.getMember(tenantId, userId);
        if (!member) {
            throw new NotFoundException('成员不存在');
        }

        return this.prisma.tenantMember.update({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
            data: { role },
        });
    }

    /**
     * 移除成员
     */
    async removeMember(tenantId: string, userId: string): Promise<void> {
        const member = await this.getMember(tenantId, userId);
        if (!member) {
            throw new NotFoundException('成员不存在');
        }

        if (member.role === 'owner') {
            throw new BadRequestException('不能移除所有者');
        }

        await this.prisma.tenantMember.delete({
            where: {
                tenantId_userId: {
                    tenantId,
                    userId,
                },
            },
        });
    }

    /**
     * 切换当前租户
     */
    async switchTenant(userId: string, tenantId: string): Promise<void> {
        // 验证用户是否属于该租户
        const member = await this.getMember(tenantId, userId);
        if (!member) {
            throw new BadRequestException('您不属于该空间');
        }

        await this.prisma.$transaction([
            // 1. Set all user's memberships to current: false
            this.prisma.tenantMember.updateMany({
                where: { userId },
                data: { current: false },
            }),
            // 2. Set target membership to current: true
            this.prisma.tenantMember.update({
                where: {
                    tenantId_userId: {
                        tenantId,
                        userId,
                    },
                },
                data: { current: true },
            }),
        ]);
    }

    /**
     * 获取用户当前激活的租户
     */
    async getCurrentTenant(userId: string): Promise<Tenant | null> {
        const membership = await this.prisma.tenantMember.findFirst({
            where: {
                userId,
                current: true,
            },
            include: {
                tenant: true,
            },
        });

        return membership?.tenant || null;
    }
}
