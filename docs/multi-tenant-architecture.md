# OpenLearn 多租户架构设计文档

## 1. 概述

### 1.1 设计目标

OpenLearn 采用多租户（Multi-Tenant）架构设计，允许不同的用户或组织（租户）共享同一应用实例，同时保持数据隔离和安全性。本设计参考了 Dify 的成熟多租户架构实践。

**核心目标：**
- ✅ **数据隔离**：确保不同租户的数据完全隔离，互不干扰
- ✅ **灵活切换**：用户可以轻松在不同租户（空间）之间切换
- ✅ **权限控制**：支持租户内的细粒度角色和权限管理
- ✅ **可扩展性**：支持未来大规模租户增长
- ✅ **成本优化**：共享基础设施，降低运营成本

### 1.2 应用场景

- **个人空间**：每个用户拥有自己的私有学习空间
- **团队协作**：教育机构、学习小组可以创建共享空间
- **企业培训**：企业可以为不同部门创建独立的培训空间
- **多项目管理**：用户可以为不同学习项目创建独立空间

---

## 2. 核心概念

### 2.1 租户（Tenant / Workspace）

**租户**是数据隔离的基本单位，在 OpenLearn 中称为"空间"（Space）。

**特性：**
- 每个租户拥有独立的数据空间
- 可以有多个成员
- 有独立的配置和权限设置
- 支持不同的订阅计划（Free、Pro、Enterprise）

### 2.2 用户（User / Account）

**用户**是系统的基本账户单位，一个用户可以：
- 属于多个租户
- 在不同租户中拥有不同的角色
- 创建和拥有自己的租户
- 在租户之间自由切换

### 2.3 租户成员（TenantMember）

**租户成员**定义了用户与租户的关系，包括：
- 用户在租户中的角色
- 用户的访问权限
- 当前激活的租户标识

---

## 3. 数据模型设计

### 3.1 核心表结构

基于 Dify 的最佳实践，OpenLearn 采用 **"共享数据库，共享模式"（Shared Database, Shared Schema）** 的多租户架构模式。

#### 3.1.1 用户表（users）

```prisma
model User {
  id                String    @id @default(uuid())
  email             String    @unique
  name              String
  password          String?   // Nullable for SSO users
  passwordSalt      String?   @map("password_salt")
  avatar            String?
  interfaceLanguage String?   @map("interface_language")
  timezone          String?
  lastLoginAt       DateTime? @map("last_login_at")
  lastLoginIp       String?   @map("last_login_ip")
  status            String    @default("active") // active, banned, closed
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  // Relationships
  tenants           TenantMember[]
  ownedTenants      Tenant[]       @relation("TenantOwner")
  accounts          Account[]      // SSO Accounts

  @@map("users")
}
```

**字段说明：**
- `id`: 用户唯一标识
- `email`: 登录邮箱，全局唯一
- `name`: 用户显示名称
- `password/passwordSalt`: 密码哈希和盐值
- `status`: 账户状态（active/banned/closed）
- `interfaceLanguage`: 用户界面语言偏好
- `lastLoginAt/lastLoginIp`: 登录追踪

#### 3.1.2 租户表（tenants）

```prisma
model Tenant {
  id               String   @id @default(uuid())
  name             String
  plan             String   @default("basic")
  status           String   @default("normal")
  encryptPublicKey String?  @map("encrypt_public_key")
  customConfig     String?  @map("custom_config") // JSON string
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  // Relationships
  members          TenantMember[]
  ownerId          String?        @map("owner_id")
  owner            User?          @relation("TenantOwner", fields: [ownerId], references: [id])

  @@map("tenants")
}
```

**字段说明：**
- `id`: 租户唯一标识
- `name`: 租户名称（如 "rqq's Space"）
- `plan`: 订阅计划（basic/pro/enterprise）
- `status`: 租户状态（normal/suspended/archived）
- `ownerId`: 租户所有者（创建者）
- `customConfig`: 租户自定义配置（JSON 格式）
- `encryptPublicKey`: 加密公钥（用于敏感数据加密）

#### 3.1.3 租户成员表（tenant_members）

```prisma
model TenantMember {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  userId    String   @map("user_id")
  role      String   @default("normal") // owner, admin, editor, normal
  current   Boolean  @default(false)    // 是否为用户当前激活的租户
  invitedBy String?  @map("invited_by")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relationships
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  user      User     @relation(fields: [userId], references: [id])

  @@unique([tenantId, userId])
  @@map("tenant_members")
}
```

**字段说明：**
- `tenantId`: 关联的租户 ID
- `userId`: 关联的用户 ID
- `role`: 用户在租户中的角色
  - `owner`: 所有者（创建者）
  - `admin`: 管理员
  - `editor`: 编辑者
  - `normal`: 普通成员
- `current`: 标识该租户是否为用户当前激活的租户
- `invitedBy`: 邀请人 ID（用于追踪邀请链）

### 3.2 业务数据表设计

所有业务数据表都需要包含 `tenantId` 字段以实现数据隔离。

#### 3.2.1 学习内容表示例

```prisma
model LearningContent {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")  // 🔑 租户隔离字段
  title       String
  content     String   @db.Text
  type        String   // pdf, video, chat, etc.
  createdBy   String   @map("created_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  creator     User     @relation(fields: [createdBy], references: [id])

  @@index([tenantId])  // 🔑 必须为 tenantId 创建索引
  @@map("learning_contents")
}
```

#### 3.2.2 知识库表示例

```prisma
model KnowledgeBase {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")  // 🔑 租户隔离字段
  name        String
  description String?
  type        String   // document, url, api
  config      String?  @db.Text // JSON configuration
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  documents   Document[]

  @@index([tenantId])  // 🔑 必须为 tenantId 创建索引
  @@map("knowledge_bases")
}
```

### 3.3 数据隔离原则

> [!IMPORTANT]
> **所有业务数据表必须遵循以下原则：**

1. **必须包含 `tenantId` 字段**
   ```prisma
   tenantId String @map("tenant_id")
   ```

2. **必须为 `tenantId` 创建索引**
   ```prisma
   @@index([tenantId])
   ```

3. **所有查询必须包含租户过滤**
   ```typescript
   // ✅ 正确
   await prisma.learningContent.findMany({
     where: { tenantId: currentTenantId }
   });

   // ❌ 错误 - 缺少租户过滤
   await prisma.learningContent.findMany();
   ```

4. **外键关系需要考虑租户边界**
   - 同一租户内的数据可以相互引用
   - 跨租户的数据引用需要特殊处理

---

## 4. API 设计

### 4.1 租户上下文获取

#### 4.1.1 从请求中获取当前租户

```typescript
// src/common/decorators/current-tenant.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.currentTenant;
  },
);
```

#### 4.1.2 租户上下文中间件

```typescript
// src/common/middleware/tenant-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userId = req.user?.id; // 从 JWT 中获取
    
    if (!userId) {
      return next();
    }

    // 获取用户当前激活的租户
    const currentMembership = await this.prisma.tenantMember.findFirst({
      where: {
        userId,
        current: true,
      },
      include: {
        tenant: true,
      },
    });

    if (currentMembership) {
      req['currentTenant'] = currentMembership.tenant;
      req['currentTenantId'] = currentMembership.tenantId;
      req['currentRole'] = currentMembership.role;
    }

    next();
  }
}
```

### 4.2 租户管理 API

#### 4.2.1 创建租户（空间）

```typescript
POST /api/tenants

Request:
{
  "name": "我的学习空间"
}

Response:
{
  "id": "uuid",
  "name": "我的学习空间",
  "plan": "basic",
  "status": "normal",
  "role": "owner",
  "createdAt": "2025-11-23T10:00:00Z"
}
```

#### 4.2.2 获取用户的所有租户

```typescript
GET /api/tenants

Response:
{
  "tenants": [
    {
      "id": "uuid-1",
      "name": "rqq's Space",
      "role": "owner",
      "current": true,
      "memberCount": 1,
      "plan": "basic"
    },
    {
      "id": "uuid-2",
      "name": "团队学习空间",
      "role": "admin",
      "current": false,
      "memberCount": 5,
      "plan": "pro"
    }
  ]
}
```

#### 4.2.3 切换当前租户

```typescript
POST /api/tenants/:tenantId/switch

Response:
{
  "success": true,
  "currentTenant": {
    "id": "uuid",
    "name": "团队学习空间",
    "role": "admin"
  }
}
```

#### 4.2.4 邀请成员

```typescript
POST /api/tenants/:tenantId/members

Request:
{
  "email": "user@example.com",
  "role": "editor"
}

Response:
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "editor",
  "status": "pending"
}
```

### 4.3 租户隔离的业务 API

所有业务 API 都应该自动应用租户过滤：

```typescript
// src/modules/learning/learning.service.ts
@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.learningContent.findMany({
      where: { tenantId }, // 🔑 租户过滤
    });
  }

  async create(tenantId: string, userId: string, data: CreateLearningDto) {
    return this.prisma.learningContent.create({
      data: {
        ...data,
        tenantId, // 🔑 自动关联租户
        createdBy: userId,
      },
    });
  }
}
```

---

## 5. 前端实现方案

### 5.1 租户上下文管理

#### 5.1.1 租户上下文 Provider

```typescript
// src/context/TenantContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  role: string;
  plan: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);

  const refreshTenants = async () => {
    const response = await fetch('/api/tenants');
    const data = await response.json();
    setTenants(data.tenants);
    
    const current = data.tenants.find((t: Tenant) => t.current);
    setCurrentTenant(current || null);
  };

  const switchTenant = async (tenantId: string) => {
    await fetch(`/api/tenants/${tenantId}/switch`, { method: 'POST' });
    await refreshTenants();
  };

  useEffect(() => {
    refreshTenants();
  }, []);

  return (
    <TenantContext.Provider value={{ currentTenant, tenants, switchTenant, refreshTenants }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) throw new Error('useTenant must be used within TenantProvider');
  return context;
};
```

### 5.2 Sidebar 空间切换实现

```tsx
// src/components/Sidebar.tsx
'use client';

import { useTenant } from '@/context/TenantContext';
import { Plus, Box, Check } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar() {
  const { currentTenant, tenants, switchTenant } = useTenant();
  const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);

  return (
    <div className="w-64 h-screen border-r flex flex-col bg-white">
      {/* ... 其他内容 ... */}

      {/* 空间切换区域 */}
      <div className="px-4 mb-6">
        <h3 className="text-xs font-bold text-gray-900 mb-2 px-2">空间</h3>
        
        {/* 创建空间按钮 */}
        <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors">
          <Plus size={20} />
          <span>创造空间</span>
        </button>

        {/* 当前空间 */}
        <div className="relative">
          <button
            onClick={() => setIsSpaceMenuOpen(!isSpaceMenuOpen)}
            className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors"
          >
            <Box size={20} />
            <span className="flex-1 text-left truncate">
              {currentTenant?.name || '选择空间'}
            </span>
            <ChevronDown size={16} className={`transition-transform ${isSpaceMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* 空间切换下拉菜单 */}
          {isSpaceMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-lg rounded-lg mt-1 overflow-hidden z-10">
              <div className="p-1 max-h-64 overflow-y-auto">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => {
                      switchTenant(tenant.id);
                      setIsSpaceMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                  >
                    <Box size={16} />
                    <span className="flex-1 truncate">{tenant.name}</span>
                    {tenant.id === currentTenant?.id && (
                      <Check size={16} className="text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ... 其他内容 ... */}
    </div>
  );
}
```

### 5.3 自动租户过滤的 API 调用

```typescript
// src/lib/api.ts
export async function fetchWithTenant(url: string, options?: RequestInit) {
  // 当前租户 ID 会自动从 Cookie 或 JWT 中获取
  // 后端中间件会自动应用租户过滤
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
  });
}

// 使用示例
const learningContents = await fetchWithTenant('/api/learning/contents');
// 返回的数据自动限制在当前租户范围内
```

---

## 6. 安全和权限控制

### 6.1 租户隔离安全检查

#### 6.1.1 租户访问守卫

```typescript
// src/common/guards/tenant-access.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const tenantId = request.currentTenantId;

    if (!userId || !tenantId) {
      throw new ForbiddenException('租户上下文缺失');
    }

    // 验证用户是否属于该租户
    const membership = await this.prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('您不属于该租户');
    }

    return true;
  }
}
```

#### 6.1.2 角色权限守卫

```typescript
// src/common/guards/tenant-role.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantRoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.currentRole;

    const roleHierarchy = {
      owner: 4,
      admin: 3,
      editor: 2,
      normal: 1,
    };

    const hasPermission = requiredRoles.some(
      (role) => roleHierarchy[userRole] >= roleHierarchy[role]
    );

    if (!hasPermission) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
```

#### 6.1.3 使用示例

```typescript
// src/modules/learning/learning.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TenantAccessGuard } from '@/common/guards/tenant-access.guard';
import { TenantRoleGuard } from '@/common/guards/tenant-role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentTenant } from '@/common/decorators/current-tenant.decorator';

@Controller('learning')
@UseGuards(TenantAccessGuard)
export class LearningController {
  // 所有成员都可以查看
  @Get()
  async findAll(@CurrentTenant() tenantId: string) {
    return this.learningService.findAll(tenantId);
  }

  // 只有 editor 及以上角色可以创建
  @Post()
  @UseGuards(TenantRoleGuard)
  @Roles('editor')
  async create(@CurrentTenant() tenantId: string, @Body() data: CreateLearningDto) {
    return this.learningService.create(tenantId, data);
  }

  // 只有 admin 及以上角色可以删除
  @Delete(':id')
  @UseGuards(TenantRoleGuard)
  @Roles('admin')
  async delete(@Param('id') id: string) {
    return this.learningService.delete(id);
  }
}
```

### 6.2 数据访问安全原则

> [!CAUTION]
> **严格遵守以下安全原则，防止数据泄露：**

1. **永远不要信任前端传来的 `tenantId`**
   ```typescript
   // ❌ 危险 - 前端可以伪造 tenantId
   async findAll(@Body() { tenantId }: any) {
     return this.prisma.learningContent.findMany({ where: { tenantId } });
   }

   // ✅ 安全 - 从认证上下文获取
   async findAll(@CurrentTenant() tenantId: string) {
     return this.prisma.learningContent.findMany({ where: { tenantId } });
   }
   ```

2. **所有数据库查询必须包含租户过滤**
   ```typescript
   // ❌ 危险 - 可能泄露其他租户数据
   await prisma.learningContent.findUnique({ where: { id } });

   // ✅ 安全 - 同时验证租户
   await prisma.learningContent.findFirst({
     where: { id, tenantId: currentTenantId }
   });
   ```

3. **跨租户操作需要明确授权**
   - 系统管理员操作需要特殊权限
   - 记录所有跨租户访问日志

4. **敏感配置使用租户级加密**
   ```typescript
   // 使用租户的 encryptPublicKey 加密敏感数据
   const encrypted = encrypt(sensitiveData, tenant.encryptPublicKey);
   ```

---

## 7. 实施路线图

### 7.1 第一阶段：基础多租户功能（已完成 ✅）

- [x] 数据库模型设计（User、Tenant、TenantMember）
- [x] Prisma Schema 定义
- [x] 基础表结构创建

### 7.2 第二阶段：后端 API 实现（待实施）

#### 任务清单

- [ ] **租户管理模块**
  - [ ] 创建租户 API
  - [ ] 获取用户租户列表 API
  - [ ] 切换当前租户 API
  - [ ] 更新租户信息 API
  - [ ] 删除租户 API

- [ ] **成员管理模块**
  - [ ] 邀请成员 API
  - [ ] 移除成员 API
  - [ ] 更新成员角色 API
  - [ ] 获取租户成员列表 API

- [ ] **租户上下文中间件**
  - [ ] 实现 TenantContextMiddleware
  - [ ] 实现 CurrentTenant 装饰器
  - [ ] 实现 TenantAccessGuard
  - [ ] 实现 TenantRoleGuard

- [ ] **业务数据表迁移**
  - [ ] 为现有业务表添加 `tenantId` 字段
  - [ ] 创建必要的索引
  - [ ] 数据迁移脚本（如有现有数据）

#### 预估时间：2-3 周

### 7.3 第三阶段：前端集成（待实施）

#### 任务清单

- [ ] **租户上下文管理**
  - [ ] 实现 TenantContext Provider
  - [ ] 实现 useTenant Hook
  - [ ] 全局状态管理集成

- [ ] **Sidebar 空间切换**
  - [ ] 空间列表展示
  - [ ] 空间切换交互
  - [ ] 创建空间对话框
  - [ ] 当前空间高亮显示

- [ ] **租户管理页面**
  - [ ] 租户设置页面
  - [ ] 成员管理界面
  - [ ] 邀请成员功能
  - [ ] 角色权限管理

- [ ] **API 调用适配**
  - [ ] 封装租户感知的 API 客户端
  - [ ] 更新现有 API 调用
  - [ ] 错误处理和提示

#### 预估时间：2-3 周

### 7.4 第四阶段：测试和优化（待实施）

#### 任务清单

- [ ] **单元测试**
  - [ ] 租户管理服务测试
  - [ ] 权限守卫测试
  - [ ] 数据隔离测试

- [ ] **集成测试**
  - [ ] 租户切换流程测试
  - [ ] 跨租户数据隔离测试
  - [ ] 权限控制测试

- [ ] **性能优化**
  - [ ] 数据库查询优化
  - [ ] 索引优化
  - [ ] 缓存策略

- [ ] **安全审计**
  - [ ] 数据隔离验证
  - [ ] 权限控制审查
  - [ ] 安全漏洞扫描

#### 预估时间：1-2 周

### 7.5 第五阶段：高级功能（未来规划）

- [ ] **租户级配额管理**
  - [ ] 存储空间限制
  - [ ] API 调用频率限制
  - [ ] 成员数量限制

- [ ] **租户级分析**
  - [ ] 使用统计
  - [ ] 成员活跃度
  - [ ] 资源消耗分析

- [ ] **跨租户协作**
  - [ ] 内容分享
  - [ ] 跨空间引用
  - [ ] 公开资源库

- [ ] **租户迁移工具**
  - [ ] 数据导出
  - [ ] 数据导入
  - [ ] 租户合并

#### 预估时间：按需实施

---

## 8. 最佳实践总结

### 8.1 开发规范

1. **所有业务表必须包含 `tenantId`**
   - 新建表时默认添加
   - 为 `tenantId` 创建索引

2. **所有查询必须包含租户过滤**
   - 使用装饰器自动注入
   - 代码审查时重点检查

3. **使用类型安全的 API**
   - 利用 TypeScript 类型系统
   - 避免使用 `any` 类型

4. **编写完整的测试**
   - 单元测试覆盖核心逻辑
   - 集成测试验证数据隔离

### 8.2 性能优化

1. **数据库索引策略**
   ```sql
   -- 必须为 tenantId 创建索引
   CREATE INDEX idx_learning_contents_tenant_id ON learning_contents(tenant_id);
   
   -- 组合索引优化常见查询
   CREATE INDEX idx_learning_contents_tenant_created 
   ON learning_contents(tenant_id, created_at DESC);
   ```

2. **查询优化**
   - 使用 Prisma 的 `select` 减少数据传输
   - 合理使用 `include` 避免 N+1 查询
   - 考虑使用数据库视图

3. **缓存策略**
   ```typescript
   // 缓存租户信息
   const tenant = await cache.get(`tenant:${tenantId}`, async () => {
     return prisma.tenant.findUnique({ where: { id: tenantId } });
   });
   ```

### 8.3 监控和日志

1. **租户级日志**
   ```typescript
   logger.info('Learning content created', {
     tenantId,
     userId,
     contentId,
   });
   ```

2. **性能监控**
   - 监控每个租户的查询性能
   - 识别慢查询并优化

3. **安全审计日志**
   - 记录所有租户切换操作
   - 记录权限变更
   - 记录跨租户访问尝试

---

## 9. 参考资料

### 9.1 Dify 多租户架构

- **核心表结构**：`tenants`、`accounts`、`tenant_account_joins`
- **数据隔离模式**：Shared Database, Shared Schema with Tenant Discriminator
- **数据库技术**：PostgreSQL + Vector Database
- **架构演进**：从多容器到统一 TiDB Cloud

### 9.2 多租户设计模式

1. **Shared Database, Shared Schema**（当前采用）
   - ✅ 成本最低
   - ✅ 维护简单
   - ✅ 适合大规模租户
   - ⚠️ 需要严格的数据隔离控制

2. **Shared Database, Separate Schemas**
   - ✅ 更好的数据隔离
   - ❌ 维护复杂度高
   - ❌ 扩展性受限

3. **Separate Databases**
   - ✅ 最强的数据隔离
   - ❌ 成本最高
   - ❌ 维护复杂度最高

### 9.3 相关技术文档

- [Prisma Multi-Tenancy Guide](https://www.prisma.io/docs/guides/database/multi-tenancy)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 10. 附录

### 10.1 完整的 Prisma Schema 示例

参见：[`app/server/prisma/schema.prisma`](file:///Users/rqq/openlearn/app/server/prisma/schema.prisma)

### 10.2 API 端点清单

| 端点 | 方法 | 描述 | 权限 |
|------|------|------|------|
| `/api/tenants` | GET | 获取用户的所有租户 | 已认证 |
| `/api/tenants` | POST | 创建新租户 | 已认证 |
| `/api/tenants/:id` | GET | 获取租户详情 | 租户成员 |
| `/api/tenants/:id` | PATCH | 更新租户信息 | admin+ |
| `/api/tenants/:id` | DELETE | 删除租户 | owner |
| `/api/tenants/:id/switch` | POST | 切换当前租户 | 租户成员 |
| `/api/tenants/:id/members` | GET | 获取成员列表 | 租户成员 |
| `/api/tenants/:id/members` | POST | 邀请成员 | admin+ |
| `/api/tenants/:id/members/:userId` | PATCH | 更新成员角色 | admin+ |
| `/api/tenants/:id/members/:userId` | DELETE | 移除成员 | admin+ |

### 10.3 角色权限矩阵

| 操作 | owner | admin | editor | normal |
|------|-------|-------|--------|--------|
| 查看内容 | ✅ | ✅ | ✅ | ✅ |
| 创建内容 | ✅ | ✅ | ✅ | ❌ |
| 编辑自己的内容 | ✅ | ✅ | ✅ | ❌ |
| 编辑他人的内容 | ✅ | ✅ | ✅ | ❌ |
| 删除内容 | ✅ | ✅ | ❌ | ❌ |
| 邀请成员 | ✅ | ✅ | ❌ | ❌ |
| 移除成员 | ✅ | ✅ | ❌ | ❌ |
| 修改成员角色 | ✅ | ✅ | ❌ | ❌ |
| 修改租户设置 | ✅ | ✅ | ❌ | ❌ |
| 删除租户 | ✅ | ❌ | ❌ | ❌ |
| 转让所有权 | ✅ | ❌ | ❌ | ❌ |

---

## 11. 总结

OpenLearn 的多租户架构设计参考了 Dify 的成熟实践，采用"共享数据库，共享模式"的设计模式，通过 `tenantId` 字段实现数据隔离。

**核心优势：**
- 🎯 **灵活性**：用户可以创建多个空间，在不同空间之间自由切换
- 🔒 **安全性**：严格的数据隔离和权限控制
- 📈 **可扩展性**：支持大规模租户增长
- 💰 **成本优化**：共享基础设施，降低运营成本

**下一步行动：**
1. 审查并确认本设计文档
2. 开始实施第二阶段：后端 API 开发
3. 逐步完成前端集成和测试

---

**文档版本**：v1.0  
**创建日期**：2025-11-23  
**最后更新**：2025-11-23  
**维护者**：OpenLearn Team
