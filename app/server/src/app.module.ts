import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './common/config/configuration';
import { validationSchema } from './common/config/validation.schema';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuthModule } from './modules/auth/auth.module';
import { ModelProviderModule } from './modules/model-provider/model-provider.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validationSchema,
    }),
    PrismaModule,
    UserModule,
    TenantModule,
    AuthModule,
    ModelProviderModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 应用租户上下文中间件到所有路由
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*');
  }
}
