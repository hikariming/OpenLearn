import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ModelController } from './model.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ModelProviderModule } from '../model-provider/model-provider.module';

@Module({
    imports: [PrismaModule, ModelProviderModule],
    controllers: [ChatController, ModelController],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule { }
