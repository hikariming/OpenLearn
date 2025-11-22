import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Tenant, TenantMember } from '@prisma/client';

@Injectable()
export class TenantService {
    constructor(private prisma: PrismaService) { }

    async tenant(
        tenantWhereUniqueInput: Prisma.TenantWhereUniqueInput,
    ): Promise<Tenant | null> {
        return this.prisma.tenant.findUnique({
            where: tenantWhereUniqueInput,
        });
    }

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

    async createTenant(data: Prisma.TenantCreateInput): Promise<Tenant> {
        return this.prisma.tenant.create({
            data,
        });
    }

    async addMember(data: Prisma.TenantMemberCreateInput): Promise<TenantMember> {
        return this.prisma.tenantMember.create({
            data,
        });
    }

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

    async switchTenant(userId: string, tenantId: string): Promise<void> {
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
}
