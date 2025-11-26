import { Controller, Post, Body, UseGuards, Req, Res, Get, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';
import type { Response, Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        tenantId: string;
    };
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
    constructor(private readonly chatService: ChatService) { }

    @Post('sessions')
    async createSession(@Req() req: AuthenticatedRequest, @Body() body: { title?: string; provider: string; model: string }) {
        return this.chatService.createSession(req.user.id, req.user.tenantId, body);
    }

    @Get('sessions')
    async getSessions(@Req() req: AuthenticatedRequest) {
        return this.chatService.getSessions(req.user.id, req.user.tenantId);
    }

    @Get('sessions/:id')
    async getSession(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
        return this.chatService.getSession(id, req.user.id);
    }

    @Post('completions')
    async chat(@Req() req: AuthenticatedRequest, @Body() body: { sessionId: string; message: string; provider?: string; model?: string }, @Res() res: Response) {
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            const stream = await this.chatService.chat(body.sessionId, req.user.id, body.message, body.provider, body.model);

            for await (const chunk of stream) {
                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
        } catch (error) {
            console.error('Chat error:', error);
            res.write(`data: ${JSON.stringify({ error: 'Internal Server Error' })}\n\n`);
        } finally {
            res.end();
        }
    }
}
