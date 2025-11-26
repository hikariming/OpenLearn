# 基础通用聊天功能设计文档 (Basic Chat Design)

## 1. 概述
本阶段目标是实现一个**支持多模型切换**的基础聊天界面。用户可以在创建新对话或对话过程中，选择使用不同的模型供应商（如 OpenAI, Anthropic）及其对应的模型（如 GPT-4, Claude 3.5）。

## 2. 用户体验 (UX) 设计

### 2.1 聊天入口
- **位置**: Sidebar -> "Chat" 或 "AI 助手"。
- **新建对话**: 点击 "+" 按钮进入新对话页面。

### 2.2 模型选择器 (核心需求)
在聊天界面的顶部导航栏或输入框上方，提供一个**模型选择下拉菜单**。
- **展示内容**:
    - 分组展示：按供应商分组 (e.g., "OpenAI", "Anthropic", "Local").
    - 模型列表：显示该租户已配置且启用的模型 (e.g., "GPT-4o", "Claude 3.5 Sonnet").
    - 状态指示：当前选中的模型。
- **交互**:
    - **新建对话时**: 用户选择模型，该选择将作为此会话的默认模型。
    - **对话中**: (可选) 允许中途切换模型，或者锁定会话使用的模型。*建议：初期版本允许中途切换，灵活度更高。*

### 2.3 聊天界面
- **消息列表**: 区分用户（右侧）和 AI（左侧）。支持 Markdown 渲染（代码高亮、表格）。
- **输入区域**: 文本输入框，发送按钮，停止生成按钮。
- **流式响应**: 打字机效果显示 AI 回复。

---

## 3. 后端设计 (NestJS)

### 3.1 数据库 Schema 变更 (`schema.prisma`)

我们需要在 `ChatSession` 中记录当前会话使用的模型配置，以便在历史记录中回溯，或作为默认上下文。

```prisma
model ChatSession {
  id          String   @id @default(uuid())
  userId      String
  // ... 其他字段
  
  // 新增字段: 记录会话默认使用的模型
  provider    String   @default("openai") // e.g., 'openai'
  model       String   @default("gpt-3.5-turbo") // e.g., 'gpt-4'
  
  // ... 关系
}

model ChatMessage {
  id          String   @id @default(uuid())
  // ... 其他字段
  
  // 可选: 记录该条消息具体使用的模型 (如果允许中途切换)
  usedProvider String?
  usedModel    String?
}
```

### 3.2 API 接口设计

#### 1. 获取可用模型列表
- **GET** `/api/tenants/:tenantId/models`
- **功能**: 返回该租户下所有已配置且启用的模型列表。
- **响应**:
  ```json
  [
    {
      "provider": "openai",
      "models": [
        { "id": "gpt-4", "name": "GPT-4" },
        { "id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo" }
      ]
    },
    {
      "provider": "anthropic",
      "models": [ ... ]
    }
  ]
  ```

#### 2. 创建/更新会话
- **POST** `/api/chat/sessions`
- **Body**: `{ title?: string, provider: string, model: string }`

#### 3. 发送消息 (流式)
- **POST** `/api/chat/completions`
- **Body**:
  ```json
  {
    "sessionId": "...",
    "message": "用户输入的内容",
    "provider": "openai", //以此处指定为准，若未指定则使用 Session 默认
    "model": "gpt-4"
  }
  ```
- **实现 (LangGraph)**:
    - 使用 **LangGraph** 构建图结构 (`StateGraph`)。
    - **State**: 包含 `messages` (BaseMessage[]), `provider`, `model`。
    - **Nodes**:
        - `agent`: 调用 LLM (支持 Tool Calling)。
        - `tools`: 执行工具调用 (未来扩展)。
    - **Workflow**: `START` -> `agent` -> `END` (当前基础版)。
    - **Streaming**: 使用 LangChain 的 `.streamEvents()` 将中间步骤和最终结果流式传输给前端。

---

## 4. 前端设计 (Next.js)

### 4.1 组件结构
- `ChatLayout`: 包含左侧历史记录列表，右侧聊天区域。
- `ChatInterface`: 核心聊天组件。
    - `ModelSelector`: 下拉菜单组件，调用 `/api/tenants/:tenantId/models`。
    - `MessageList`: 渲染消息流。
    - `InputArea`: 输入框。

### 4.2 状态管理
- 使用 `useChat` (Vercel AI SDK) 管理消息列表。
- **关键集成**: Vercel AI SDK 的 `LangChainAdapter` 可以轻松对接 LangGraph 的流式输出。


---

## 5. 实施步骤

1.  **Schema 更新**: 修改 `ChatSession` 添加模型字段。
2.  **后端 API**:
    -   实现 `ModelController` (列出可用模型)。
    -   实现 `ChatController` (处理对话请求，动态调用 Provider)。
3.  **前端 UI**:
    -   实现 `ModelSelector` 组件。
    -   集成 `useChat` 并传递 `body: { provider, model }`。
