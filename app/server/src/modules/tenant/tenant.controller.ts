import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { TenantRoleGuard } from '../../common/guards/tenant-role.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import {
    CreateTenantDto,
    UpdateTenantDto,
    InviteMemberDto,
    UpdateMemberRoleDto,
} from './dto/tenant.dto';

/**
 * 租户（空间）管理控制器
 */
@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    /**
     * 获取用户的所有租户
     */
    @Get()
    async getUserTenants(@Request() req: any) {
        return this.tenantService.getUserTenants(req.user.id);
    }

    /**
     * 获取当前激活的租户
     */
    @Get('current')
    async getCurrentTenant(@Request() req: any) {
        const tenant = await this.tenantService.getCurrentTenant(req.user.id);
        if (!tenant) {
            return { message: '未选择空间' };
        }
        return tenant;
    }

    /**
     * 创建新租户
     */
    @Post()
    async createTenant(@Request() req: any, @Body() createTenantDto: CreateTenantDto) {
        return this.tenantService.createTenant(req.user.id, createTenantDto.name);
    }

    /**
     * 获取租户详情
     */
    @Get(':id')
    @UseGuards(TenantAccessGuard)
    async getTenant(@Param('id') id: string) {
        return this.tenantService.tenant({ id });
    }

    /**
     * 更新租户信息（需要 admin 权限）
     */
    @Patch(':id')
    @UseGuards(TenantAccessGuard, TenantRoleGuard)
    @Roles('admin')
    async updateTenant(
        @Param('id') id: string,
        @Body() updateTenantDto: UpdateTenantDto,
    ) {
        return this.tenantService.updateTenant(id, updateTenantDto);
    }

    /**
     * 删除租户（只有 owner 可以删除）
     */
    @Delete(':id')
    @UseGuards(TenantAccessGuard, TenantRoleGuard)
    @Roles('owner')
    async deleteTenant(@Param('id') id: string) {
        await this.tenantService.deleteTenant(id);
        return { message: '空间已删除' };
    }

    /**
     * 切换当前租户
     */
    @Post(':id/switch')
    async switchTenant(@Request() req: any, @Param('id') id: string) {
        await this.tenantService.switchTenant(req.user.id, id);
        const tenant = await this.tenantService.tenant({ id });
        return {
            success: true,
            currentTenant: tenant,
        };
    }

    /**
     * 获取租户成员列表
     */
    @Get(':id/members')
    @UseGuards(TenantAccessGuard)
    async getTenantMembers(@Param('id') id: string) {
        return this.tenantService.getTenantMembers(id);
    }

    /**
     * 邀请成员（需要 admin 权限）
     */
    @Post(':id/members')
    @UseGuards(TenantAccessGuard, TenantRoleGuard)
    @Roles('admin')
    async inviteMember(
        @Request() req: any,
        @Param('id') id: string,
        @Body() inviteMemberDto: InviteMemberDto,
    ) {
        return this.tenantService.inviteMember(
            id,
            inviteMemberDto.email,
            inviteMemberDto.role || 'normal',
            req.user.id,
        );
    }

    /**
     * 更新成员角色（需要 admin 权限）
     */
    @Patch(':id/members/:userId')
    @UseGuards(TenantAccessGuard, TenantRoleGuard)
    @Roles('admin')
    async updateMemberRole(
        @Param('id') id: string,
        @Param('userId') userId: string,
        @Body() updateMemberRoleDto: UpdateMemberRoleDto,
    ) {
        return this.tenantService.updateMemberRole(
            id,
            userId,
            updateMemberRoleDto.role,
        );
    }

    /**
     * 移除成员（需要 admin 权限）
     */
    @Delete(':id/members/:userId')
    @UseGuards(TenantAccessGuard, TenantRoleGuard)
    @Roles('admin')
    async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
        await this.tenantService.removeMember(id, userId);
        return { message: '成员已移除' };
    }
}
