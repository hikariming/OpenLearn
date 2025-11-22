# 技术方案：全栈架构与多端部署设计

## 1. 项目概述
本项目旨在构建一个可扩展的学习平台，支持云端部署（Web SaaS）和本地运行（桌面应用）。
前端已迁移至 `app/web`，后端将采用 NestJS + Prisma 构建，支持灵活的数据库和存储策略。

## 2. 技术栈选型

### 前端 (Frontend)
- **框架**: Next.js (React)
- **位置**: `app/web`
- **UI库**: TailwindCSS + Shadcn/UI (假设)

### 后端 (Backend)
- **框架**: NestJS
    - **理由**: 模块化架构，适合大型应用，TypeScript 支持完美，生态丰富。
- **ORM**: Prisma
    - **理由**: 强类型数据库客户端，支持多种数据库（PostgreSQL, SQLite），易于迁移。
- **位置**: `app/server` (建议新建)

### 数据库 (Database)
采用适配器模式，根据环境切换底层数据库：
- **云端/Docker 环境**: PostgreSQL
    - **优势**: 强大、稳定，支持向量插件 (pgvector) 和图查询 (Apache AGE)。
- **本地/桌面 环境**: SQLite
    - **优势**: 单文件数据库，无需安装服务，零配置启动。

### 文件存储 (File Storage)
采用抽象存储层 (Storage Interface)：
- **云端/Docker**: MinIO / S3 兼容服务。
- **本地/桌面**: 本地文件系统 (Local File System)。

## 3. 架构设计

### 3.1 Monorepo 结构
建议采用 Pnpm Workspace 管理多包：
```
/
├── package.json (Root)
├── pnpm-workspace.yaml
├── apps/
│   ├── web/ (Next.js 前端)
│   ├── server/ (NestJS 后端)
│   └── desktop/ (Electron/Tauri 壳，可选)
└── packages/ (共享库，如类型定义)
```

### 3.2 数据库适配 (Prisma)
Prisma 支持多环境配置。我们可以通过环境变量控制使用哪个 schema 或 datasource url。
- **方案 A**: 统一 Schema，运行时切换 URL。
    - 适用于 PG 和 SQLite 结构基本一致的情况。
    - 注意：SQLite 不支持部分 PG 特性（如 Enum, JSONB 某些操作），需在设计 Schema 时保持兼容性。
- **方案 B**: 动态 Schema（较复杂，不推荐）。

**推荐**: 保持 Schema 兼容 SQLite，利用 Prisma Client 自动适配。

### 3.3 存储适配 (Storage Service)
在 NestJS 中定义 `IStorageService` 接口：
```typescript
interface IStorageService {
  upload(file: File): Promise<string>;
  getUrl(key: string): Promise<string>;
}
```
- `S3StorageService`: 实现 S3 协议上传。
- `LocalStorageService`: 实现本地磁盘写入。
通过 `ConfigService` 在启动时注入对应的实现。

## 4. 部署方案

### 4.1 云端 / Docker 部署
使用 `docker-compose` 编排：
- **Services**:
    - `app-web`: Next.js 容器
    - `app-server`: NestJS 容器
    - `postgres`: 数据库
    - `minio`: 对象存储
    - `redis`: 缓存 (可选)

### 4.2 本地 / 桌面应用 (Desktop App)
用户希望“本地可以直接变成一个程序app启动”。

**方案**: **Electron + Next.js + NestJS**

- **原理**:
    1. Electron 启动主进程。
    2. 主进程在后台启动 NestJS 服务（作为一个子进程，监听本地端口，如 3001）。
    3. 主进程启动 Next.js (或加载静态导出的 Next.js 文件)。
    4. 窗口加载 `http://localhost:3001` (API) 和 前端页面。

- **数据存储**:
    - NestJS 配置为使用 SQLite (`file:./local.db`)。
    - 文件存储配置为本地目录 (`app.getPath('userData')`).

- **可行性**: 完全可行。这是许多现代桌面应用（如 Notion 早期版本、某些开发工具）的模式。

### 5. 未来扩展 (向量与图谱)

- **向量数据库 (Vector DB)**:
    - **云端**: 使用 `pgvector` 插件扩展 PostgreSQL。
    - **本地**:
        - 方案 1: 使用 `sqlite-vss` 扩展 SQLite (支持向量搜索)。
        - 方案 2: 集成 `LanceDB` (嵌入式向量库，无需独立服务，非常适合本地应用)。
- **图谱 (Graph)**:
    - **云端**: PostgreSQL + Apache AGE 或独立 Neo4j。
    - **本地**: 简单的图关系可用 SQL 递归查询解决。复杂图谱可考虑嵌入式图库或将图数据序列化存储。

## 6. 下一步行动计划
1. 初始化 `app/server` (NestJS)。
2. 配置 Monorepo (pnpm-workspace)。
3. 设置 Prisma schema (定义 User, Post 等基础模型)。
4. 实现 Storage Module (S3/Local 切换)。
5. 编写 Dockerfile 和 docker-compose.yml。
