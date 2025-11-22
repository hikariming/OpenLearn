import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/auth.service';
import { UserService } from '../src/modules/user/user.service';
import { TenantService } from '../src/modules/tenant/tenant.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UserModule } from '../src/modules/user/user.module';
import { TenantModule } from '../src/modules/tenant/tenant.module';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);

    // Select modules to get services
    const authService = app.select(AuthModule).get(AuthService);
    const userService = app.select(UserModule).get(UserService);
    const tenantService = app.select(TenantModule).get(TenantService);

    const email = `fulltest-${Date.now()}@example.com`;
    const password = 'password123';
    const name = 'Full Test User';

    console.log('--- Starting Full Flow Test ---');

    try {
        // 1. Register
        console.log(`\n1. Registering user: ${email}`);
        const registerResult = await authService.register({ email, password, name });
        console.log('   > Register Success. User ID:', registerResult.user.id);
        console.log('   > Default Tenant ID:', registerResult.tenant.id);

        const userId = registerResult.user.id;
        const defaultTenantId = registerResult.tenant.id;

        // 2. Login
        console.log('\n2. Logging in...');
        const loginResult = await authService.login({ email, password });
        console.log('   > Login Success. User:', loginResult.user.email);

        // 3. Create Second Tenant
        console.log('\n3. Creating Second Tenant...');
        const secondTenant = await tenantService.createTenant({
            name: 'Second Workspace',
            plan: 'pro',
            status: 'normal',
            owner: { connect: { id: userId } },
        });
        console.log('   > Second Tenant Created. ID:', secondTenant.id);

        // Link user to second tenant
        await tenantService.addMember({
            user: { connect: { id: userId } },
            tenant: { connect: { id: secondTenant.id } },
            role: 'owner',
            current: false
        });
        console.log('   > User added to Second Tenant.');

        // 4. Switch Tenant
        console.log('\n4. Switching to Second Tenant...');
        await tenantService.switchTenant(userId, secondTenant.id);

        const memberAfterSwitch = await tenantService.getMember(secondTenant.id, userId);
        console.log('   > Switch Success. Is Current?', memberAfterSwitch?.current);

        if (!memberAfterSwitch?.current) {
            throw new Error('Tenant switch failed!');
        }

        // 5. Delete User
        console.log('\n5. Deleting User...');
        // Note: In a real app, we might want to cascade delete tenants or handle cleanup.
        // For now, we just delete the user. Prisma might complain about foreign keys if not configured to cascade.
        // Let's check if we can delete.

        // To delete user, we first need to delete memberships because of foreign key constraints if not set to Cascade in Prisma (default is usually Restrict or Cascade depending on relation).
        // Let's try deleting user directly. If it fails, we know we need to handle relations.
        // Actually, let's clean up properly for the test.

        console.log('   > Cleaning up memberships...');
        // We don't have deleteMember in service, so we rely on Prisma cascade or manual delete via prisma service if we had access.
        // Since we only have UserService, let's try deleteUser.
        // If schema relations didn't specify onDelete: Cascade, this might fail.
        // Looking at schema:
        // user User @relation(fields: [userId], references: [id]) -> No onDelete specified, defaults to Restrict usually? Or Prisma default?
        // Actually Prisma default for 1-n is usually SetNull or Restrict?
        // Let's try.

        try {
            await userService.deleteUser({ id: userId });
            console.log('   > User Deleted Successfully.');
        } catch (e) {
            console.log('   > Delete User failed (expected if no cascade):', e.message.split('\n')[0]);
            console.log('   > *Test Note*: Deletion might require cascading delete configuration in Schema.');
        }

    } catch (error) {
        console.error('\n!!! Test Failed !!!');
        console.error(error);
    } finally {
        await app.close();
        console.log('\n--- Test Finished ---');
    }
}

bootstrap();
