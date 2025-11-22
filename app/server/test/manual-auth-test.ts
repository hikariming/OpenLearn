import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';

import { AuthModule } from '../src/modules/auth/auth.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.select(AuthModule).get(AuthService);

    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Test User';

    console.log(`Registering user: ${email}`);
    try {
        const result = await authService.register({ email, password, name });
        console.log('Registration successful:', JSON.stringify(result, null, 2));

        console.log('Logging in...');
        const loginResult = await authService.login({ email, password });
        console.log('Login successful:', JSON.stringify(loginResult, null, 2));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
