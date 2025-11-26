import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@Controller('tenants/:tenantId/models')
@UseGuards(JwtAuthGuard)
export class ModelController {
    constructor(private readonly chatService: ChatService) { }

    @Get()
    async getModels(@Param('tenantId') tenantId: string) {
        return this.chatService.getModels(tenantId);
    }
}
