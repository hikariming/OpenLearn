# AI 学习平台设计文档

## 1. 项目概览与当前状态分析

### 1.1 当前状态
- **前端**: Next.js (App Router) 配合 Sidebar 布局。现有的“空间 (Spaces)”（多租户）和“模型提供商设置 (Provider Settings)”（LLM 配置）。
- **后端**: NestJS 配合 Prisma (PostgreSQL)。
- **现有功能**:
    - 用户认证与多租户管理。
    - LLM 提供商配置（Schema 已存在，UI 已存在）。
    - 基础 Sidebar 导航。
- **缺失/待办**:
    - 实际的对话/问答功能。
    - 内容管理（PDF、视频、音频上传与处理）。
    - 向量数据库 / RAG 流程。
    - 闪卡系统。
    - 仪表盘分析（学习进度）。

### 1.2 目标
实现一个综合性的 AI 学习系统，包含：
1.  **多模态问答**: 支持视频、音频、PDF 和普通文本。
2.  **仪表盘集成**: 追踪学习历史和进度。
3.  **闪卡生成**: 从内容自动生成学习辅助卡片。
4.  **LLM 集成**: 具备历史记录和上下文的完整聊天能力。

---

## 2. 系统架构设计

### 2.1 高层架构
```mermaid
graph TD
    User[用户] --> FE[前端 (Next.js)]
    FE --> BE[后端 API (NestJS)]
    
    subgraph "后端服务"
        BE --> Auth[认证模块]
        BE --> Chat[聊天模块]
        BE --> Media[媒体/资源模块]
        BE --> RAG[RAG/向量模块]
    end
    
    subgraph "数据层"
        Chat --> DB[(PostgreSQL)]
        Media --> DB
        Media --> ObjStore[MinIO/S3 (文件存储)]
        RAG --> VectorDB[(pgvector/Chroma)]
    end
    
    subgraph "AI 服务"
        RAG --> LLM[LLM 提供商 (OpenAI/Anthropic)]
        Media --> Transcribe[Whisper (音频/视频转录)]
    end
```

### 2.2 数据模型设计 (Prisma Schema 扩展)

我们需要扩展 Schema 以支持学习资源、聊天和闪卡。

```prisma
// 1. 学习资源 (正在学习的内容)
model LearningResource {
  id          String   @id @default(uuid())
  tenantId    String
  title       String
  type        String   // 'pdf', 'video', 'audio', 'article'
  url         String   // 存储 URL
  content     String?  // 提取的文本 / 转录内容
  summary     String?  // AI 生成的摘要
  createdAt   DateTime @default(now())
  
  // 关系
  chats       ChatSession[]
  flashcards  Flashcard[]
  
  @@map("learning_resources")
}

// 2. 聊天系统
model ChatSession {
  id          String   @id @default(uuid())
  userId      String
  resourceId  String?  // 可选: null 表示“通用问答”
  title       String
  createdAt   DateTime @default(now())
  
  // 关系
  messages    ChatMessage[]
  resource    LearningResource? @relation(fields: [resourceId], references: [id])
  
  @@map("chat_sessions")
}

model ChatMessage {
  id          String   @id @default(uuid())
  sessionId   String
  role        String   // 'user', 'assistant', 'system'
  content     String
  createdAt   DateTime @default(now())
  
  // 关系
  session     ChatSession @relation(fields: [sessionId], references: [id])
  
  @@map("chat_messages")
}

// 3. 闪卡
model Flashcard {
  id          String   @id @default(uuid())
  resourceId  String?
  front       String   // 问题 / 术语
  back        String   // 答案 / 定义
  status      String   // 'new', 'learning', 'mastered'
  nextReview  DateTime?
  
  // 关系
  resource    LearningResource? @relation(fields: [resourceId], references: [id])
  
  @@map("flashcards")
}
```

---

## 3. 实施路线图 (渐进式)

我们将由底向上，分层构建。

### 第一阶段：基础与通用聊天
**目标**: 启用基于已配置 LLM 的基础聊天功能。
1.  **后端**:
    -   创建 `ChatModule`。
    -   实现 `ChatService` 处理 LLM API 调用（使用现有的 `ProviderConfig`）。
    -   实现 `ChatSession` 和 `ChatMessage` 的 CRUD。
2.  **前端**:
    -   创建 `/learn/chat` 页面。
    -   实现聊天 UI（消息列表、输入框）。
    -   连接后端流式 API。

### 第二阶段：资源管理 (“学习”部分)
**目标**: 允许上传和查看内容。
1.  **后端**:
    -   创建 `ResourceModule`。
    -   设置文件上传 (Multer + MinIO/S3)。
    -   实现文本提取 (PDF 用 PDF.js)。
2.  **前端**:
    -   在 Sidebar 或 Dashboard 创建上传 UI。
    -   创建查看器：PDF 阅读器、视频播放器、音频播放器。

### 第三阶段：RAG 与 上下文问答
**目标**: *针对*内容进行聊天。
1.  **后端**:
    -   **向量存储**: 设置 `pgvector` 或类似服务。
    -   **摄取**: 资源上传后 -> 文本分块 -> 生成 Embeddings -> 存入向量库。
    -   **检索**: 收到聊天消息 -> Embedding 查询 -> 搜索向量库 -> 将上下文附加到 LLM 提示词。
    -   **转录**: 针对视频/音频，集成 OpenAI Whisper (或本地模型) 生成文本用于 RAG。
2.  **前端**:
    -   更新聊天 UI 以显示“正在搜索上下文...”或引用来源。

### 第四阶段：闪卡与仪表盘
**目标**: 主动回忆与进度追踪。
1.  **后端**:
    -   创建 `FlashcardModule`。
    -   实现“生成闪卡”端点（使用资源内容提示 LLM）。
2.  **前端**:
    -   **闪卡 UI**: 滑动/翻转卡片界面。
    -   **仪表盘**:
        -   “学习时长”（追踪在查看器中的停留时间）。
        -   “已掌握卡片”统计。
        -   “最近资源”列表。

---

## 4. 技术栈建议

-   **LLM 编排**: LangChain (Node.js) 或 Vercel AI SDK (用于流式传输)。*建议：使用 Vercel AI SDK 以更好地集成 Next.js。*
-   **向量数据库**: `pgvector` (因为你已经在使用 Postgres/Prisma)。
-   **PDF 解析**: `pdf-parse` (服务端)。
-   **视频/音频**: `ffmpeg` (处理) + OpenAI Whisper API (转录)。

## 5. 下一步
1.  **确认设计**: 审阅本文档。
2.  **数据库迁移**: 应用新的 Prisma Schema。
3.  **后端设置**: 初始化 `ChatModule`。
