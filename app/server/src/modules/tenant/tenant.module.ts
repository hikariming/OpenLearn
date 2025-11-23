import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { TenantRoleGuard } from '../../common/guards/tenant-role.guard';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TenantController],
    providers: [TenantService, TenantAccessGuard, TenantRoleGuard],
    exports: [TenantService, TenantAccessGuard, TenantRoleGuard],
})
export class TenantModule { }
