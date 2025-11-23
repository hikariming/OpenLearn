import { Module } from '@nestjs/common';
import { ModelProviderController } from './model-provider.controller';
import { ModelProviderService } from './model-provider.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [ModelProviderController],
    providers: [ModelProviderService],
    exports: [ModelProviderService],
})
export class ModelProviderModule { }
