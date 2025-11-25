import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request, Patch } from '@nestjs/common';
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

    @Get('catalog')
    async getCatalog(@Request() req: any) {
        return this.service.getProviderModelCatalog(req.currentTenantId);
    }

    @Post()
    async saveProvider(@Request() req: any, @Body() body: { provider: string; config: any }) {
        return this.service.validateAndSaveProvider(req.currentTenantId, body.provider, body.config);
    }

    @Post('models/custom')
    async createCustomModel(
        @Request() req: any,
        @Body() body: { provider: string; model: string; displayName?: string; modelType: string }
    ) {
        return this.service.createCustomModel(req.currentTenantId, body);
    }

    @Patch('models/:id')
    async updateModel(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { enabled?: boolean; displayName?: string; modelType?: string }
    ) {
        return this.service.updateTenantModel(req.currentTenantId, id, body);
    }

    @Delete('models/:id')
    async deleteModel(@Request() req: any, @Param('id') id: string) {
        return this.service.deleteTenantModel(req.currentTenantId, id);
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
