# 后端测试指南

## 测试文件

- [`tenant.e2e-spec.ts`](file:///Users/rqq/openlearn/app/server/test/tenant.e2e-spec.ts) - 租户管理 API 集成测试

## 运行测试

### 运行所有 e2e 测试

```bash
cd app/server
npm run test:e2e
```

### 运行特定测试文件

```bash
cd app/server
npm run test:e2e -- tenant.e2e-spec.ts
```

### 运行测试并查看覆盖率

```bash
cd app/server
npm run test:cov
```

## 测试覆盖范围

### ✅ 用户注册和自动创建租户
- 验证注册时自动创建默认租户
- 验证用户成为租户的 owner
- 验证租户自动设置为当前激活租户

### ✅ 获取用户的所有租户
- 验证返回租户列表
- 验证未认证用户被拒绝

### ✅ 创建新租户
- 验证成功创建租户
- 验证新租户成为当前租户
- 验证输入验证（名称不能为空）

### ✅ 获取当前激活的租户
- 验证返回正确的当前租户

### ✅ 切换当前租户
- 验证成功切换租户
- 验证数据库状态更新
- 验证不能切换到不属于的租户

### ✅ 成员管理
- 验证邀请成员
- 验证获取成员列表
- 验证更新成员角色
- 验证权限控制（普通成员不能邀请）
- 验证移除成员
- 验证不能移除 owner

### ✅ 更新租户信息
- 验证 admin 可以更新租户信息

### ✅ 删除租户
- 验证只有 owner 可以删除租户
- 验证租户被正确删除

## 注意事项

1. **测试数据库**
   - 测试会使用与开发相同的数据库
   - 测试前后会自动清理测试数据
   - 建议使用独立的测试数据库

2. **环境变量**
   - 确保 `.env` 文件配置正确
   - 特别是 `DATABASE_URL` 和 `JWT_SECRET`

3. **测试隔离**
   - 每个测试套件都会清理自己的数据
   - 使用特定的邮箱前缀（`test-tenant-`）标识测试数据

## 扩展测试

### 添加业务数据隔离测试

在实际业务表创建后，添加数据隔离测试：

```typescript
describe('数据隔离测试', () => {
  it('不同租户的学习内容应该完全隔离', async () => {
    // 1. 在租户 A 创建内容
    const contentA = await createLearningContent(tenantA, 'Content A');
    
    // 2. 切换到租户 B
    await switchTenant(tenantB);
    
    // 3. 验证租户 B 看不到租户 A 的内容
    const contents = await getLearningContents();
    expect(contents).not.toContainEqual(contentA);
  });
});
```

## 故障排查

### 测试失败常见原因

1. **数据库连接失败**
   - 检查 `DATABASE_URL` 是否正确
   - 确保数据库服务正在运行

2. **JWT 认证失败**
   - 检查 `JWT_SECRET` 是否配置
   - 确保 token 格式正确

3. **Prisma 类型错误**
   - 运行 `npx prisma generate` 重新生成客户端
   - 确保 schema 与代码同步

4. **端口冲突**
   - 确保测试端口未被占用
   - 可以在测试配置中指定不同端口
