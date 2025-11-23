import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ModelProviderService } from './model-provider.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';

@Controller('model-providers')
@UseGuards(JwtAuthGuard, TenantAccessGuard)
export class ModelProviderController {
    constructor(private readonly service: ModelProviderService) { }

    @Get()
    async getProviders(@Request() req: any) {
        return this.service.getTenantProviders(req.currentTenantId);
    }

    @Post()
    async saveProvider(@Request() req: any, @Body() body: { provider: string; config: any }) {
        return this.service.validateAndSaveProvider(req.currentTenantId, body.provider, body.config);
    }

    @Delete(':provider')
    async deleteProvider(@Request() req: any, @Param('provider') provider: string) {
        return this.service.deleteProvider(req.currentTenantId, provider);
    }

    @Get('models')
    async getModels(@Request() req: any) {
        return this.service.getAvailableModels(req.currentTenantId);
    }

    @Get('settings')
    async getSettings(@Request() req: any) {
        return this.service.getModelSettings(req.currentTenantId);
    }

    @Post('settings')
    async updateSetting(@Request() req: any, @Body() body: { modelType: string; provider: string; model: string }) {
        return this.service.updateModelSetting(req.currentTenantId, body.modelType, body.provider, body.model);
    }
}
