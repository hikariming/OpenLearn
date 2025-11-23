import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * 租户管理 API 集成测试
 * 
 * 测试覆盖：
 * 1. 用户注册自动创建租户
 * 2. 获取用户的所有租户
 * 3. 创建新租户
 * 4. 切换当前租户
 * 5. 邀请成员
 * 6. 权限控制
 */
describe('Tenant Management (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let userId: string;
    let tenantId: string;
    let secondTenantId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // 清理测试数据
        await cleanupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await app.close();
    });

    /**
     * 清理测试数据
     */
    async function cleanupTestData() {
        // 删除测试用户相关的所有数据
        await prisma.tenantMember.deleteMany({
            where: {
                user: {
                    email: {
                        contains: 'test-tenant',
                    },
                },
            },
        });

        await prisma.tenant.deleteMany({
            where: {
                owner: {
                    email: {
                        contains: 'test-tenant',
                    },
                },
            },
        });

        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: 'test-tenant',
                },
            },
        });
    }

    describe('用户注册和自动创建租户', () => {
        it('应该成功注册用户并自动创建默认租户', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test-tenant-user@example.com',
                    name: '测试用户',
                    password: 'Password123!',
                })
                .expect(201);

            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('tenant');
            expect(response.body).toHaveProperty('token');

            // 保存认证信息
            authToken = response.body.token;
            userId = response.body.user.id;
            tenantId = response.body.tenant.id;

            // 验证租户名称
            expect(response.body.tenant.name).toBe("测试用户's Workspace");

            // 验证租户成员关系
            const membership = await prisma.tenantMember.findFirst({
                where: {
                    userId,
                    tenantId,
                },
            });

            expect(membership).toBeTruthy();
            expect(membership?.role).toBe('owner');
            expect(membership?.current).toBe(true);
        });
    });

    describe('获取用户的所有租户', () => {
        it('应该返回用户的所有租户列表', async () => {
            const response = await request(app.getHttpServer())
                .get('/tenants')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0]).toHaveProperty('id');
            expect(response.body[0]).toHaveProperty('name');
            expect(response.body[0]).toHaveProperty('role');
            expect(response.body[0]).toHaveProperty('current');
        });

        it('未认证用户应该返回 401', async () => {
            await request(app.getHttpServer())
                .get('/tenants')
                .expect(401);
        });
    });

    describe('创建新租户', () => {
        it('应该成功创建新租户', async () => {
            const response = await request(app.getHttpServer())
                .post('/tenants')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: '我的学习空间',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.name).toBe('我的学习空间');
            expect(response.body.plan).toBe('basic');

            secondTenantId = response.body.id;

            // 验证新租户已成为当前租户
            const membership = await prisma.tenantMember.findFirst({
                where: {
                    userId,
                    tenantId: secondTenantId,
                },
            });

            expect(membership?.current).toBe(true);
            expect(membership?.role).toBe('owner');
        });

        it('创建租户时应该验证名称不能为空', async () => {
            await request(app.getHttpServer())
                .post('/tenants')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: '',
                })
                .expect(400);
        });
    });

    describe('获取当前激活的租户', () => {
        it('应该返回当前激活的租户', async () => {
            const response = await request(app.getHttpServer())
                .get('/tenants/current')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(secondTenantId);
        });
    });

    describe('切换当前租户', () => {
        it('应该成功切换到另一个租户', async () => {
            const response = await request(app.getHttpServer())
                .post(`/tenants/${tenantId}/switch`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.currentTenant.id).toBe(tenantId);

            // 验证数据库中的状态
            const membership = await prisma.tenantMember.findFirst({
                where: {
                    userId,
                    tenantId,
                },
            });

            expect(membership?.current).toBe(true);

            // 验证之前的租户不再是当前租户
            const oldMembership = await prisma.tenantMember.findFirst({
                where: {
                    userId,
                    tenantId: secondTenantId,
                },
            });

            expect(oldMembership?.current).toBe(false);
        });

        it('切换到不属于的租户应该失败', async () => {
            await request(app.getHttpServer())
                .post('/tenants/non-existent-id/switch')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('获取租户详情', () => {
        it('应该返回租户详情', async () => {
            const response = await request(app.getHttpServer())
                .get(`/tenants/${tenantId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('id');
            expect(response.body.id).toBe(tenantId);
        });
    });

    describe('成员管理', () => {
        let secondUserId: string;
        let secondUserToken: string;

        beforeAll(async () => {
            // 创建第二个用户用于测试邀请
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    email: 'test-tenant-member@example.com',
                    name: '测试成员',
                    password: 'Password123!',
                })
                .expect(201);

            secondUserId = response.body.user.id;
            secondUserToken = response.body.token;
        });

        it('应该成功邀请成员', async () => {
            const response = await request(app.getHttpServer())
                .post(`/tenants/${tenantId}/members`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    email: 'test-tenant-member@example.com',
                    role: 'editor',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.role).toBe('editor');
        });

        it('应该返回租户的所有成员', async () => {
            const response = await request(app.getHttpServer())
                .get(`/tenants/${tenantId}/members`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(2); // owner + editor
        });

        it('应该成功更新成员角色', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/members/${secondUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    role: 'admin',
                })
                .expect(200);

            expect(response.body.role).toBe('admin');
        });

        it('普通成员不应该能够邀请其他成员', async () => {
            // 先将第二个用户降级为 normal
            await request(app.getHttpServer())
                .patch(`/tenants/${tenantId}/members/${secondUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    role: 'normal',
                })
                .expect(200);

            // 切换到第二个用户的 token
            await request(app.getHttpServer())
                .post(`/tenants/${tenantId}/members`)
                .set('Authorization', `Bearer ${secondUserToken}`)
                .send({
                    email: 'another-user@example.com',
                    role: 'editor',
                })
                .expect(403); // 权限不足
        });

        it('应该成功移除成员', async () => {
            await request(app.getHttpServer())
                .delete(`/tenants/${tenantId}/members/${secondUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // 验证成员已被移除
            const membership = await prisma.tenantMember.findFirst({
                where: {
                    userId: secondUserId,
                    tenantId,
                },
            });

            expect(membership).toBeNull();
        });

        it('不应该能够移除 owner', async () => {
            await request(app.getHttpServer())
                .delete(`/tenants/${tenantId}/members/${userId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);
        });
    });

    describe('更新租户信息', () => {
        it('admin 应该能够更新租户信息', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/tenants/${tenantId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    name: '更新后的空间名称',
                })
                .expect(200);

            expect(response.body.name).toBe('更新后的空间名称');
        });
    });

    describe('删除租户', () => {
        it('只有 owner 应该能够删除租户', async () => {
            await request(app.getHttpServer())
                .delete(`/tenants/${secondTenantId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // 验证租户已被删除
            const tenant = await prisma.tenant.findUnique({
                where: { id: secondTenantId },
            });

            expect(tenant).toBeNull();
        });
    });

    describe('数据隔离测试', () => {
        it('不同租户的数据应该完全隔离', async () => {
            // 这个测试需要在实际的业务数据表上进行
            // 这里只是一个示例框架
            // TODO: 添加具体的业务数据隔离测试
        });
    });
});
