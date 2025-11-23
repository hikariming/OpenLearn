# LLM Model Provider System Design

## 1. Overview
This document outlines the design for a multi-provider LLM system similar to Dify. It allows tenants to configure their own model providers (OpenAI, OpenRouter, etc.) and select default models for different capabilities (Text Generation, Embedding, Reranking, TTS, Speech Recognition).

## 2. Core Concepts

### 2.1 Supported Providers
The system will support the following providers initially:
- **OpenAI**: Standard OpenAI API.
- **OpenRouter**: Aggregator for various models.
- **Jina**: Specialized in Embeddings and Rerankers.
- **SiliconFlow (硅基流动)**: High-performance inference for open-source models.

### 2.2 Model Types
Models are categorized by their capabilities:
- **LLM**: Text generation / Chat (e.g., GPT-4, Claude 3).
- **Text Embedding**: Vector generation (e.g., text-embedding-3-small).
- **Rerank**: Re-ranking search results.
- **TTS**: Text-to-Speech.
- **Speech-to-Text**: Audio transcription.

## 3. Database Design

We will add two new tables to the Prisma schema: `ProviderConfig` and `TenantModelSetting`.

### 3.1 ProviderConfig
Stores the credentials and configuration for a specific provider within a tenant.

```prisma
model ProviderConfig {
  id              String   @id @default(uuid())
  tenantId        String   @map("tenant_id")
  provider        String   // e.g., 'openai', 'openrouter'
  encryptedConfig String   @map("encrypted_config") // Encrypted JSON: { "api_key": "..." }
  isValid         Boolean  @default(false) @map("is_valid")
  lastValidatedAt DateTime? @map("last_validated_at")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, provider])
  @@map("provider_configs")
}
```

### 3.2 TenantModelSetting
Stores the user's preferred default model for each category.

```prisma
model TenantModelSetting {
  id             String   @id @default(uuid())
  tenantId       String   @map("tenant_id")
  modelType      String   @map("model_type") // 'llm', 'embedding', 'rerank', 'tts', 'speech_to_text'
  provider       String   // The provider name, e.g., 'openai'
  model          String   // The model ID, e.g., 'gpt-4-turbo'
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, modelType])
  @@map("tenant_model_settings")
}
```

## 4. API Design

### 4.1 Provider Management

- **GET /api/providers**
    - Returns a list of all supported providers.
    - For each provider, indicates if it is configured (`isValid`) for the current tenant.
    - Returns the list of models available if configured.

- **POST /api/providers/validate**
    - Input: `{ provider: string, config: object }`
    - Action: Tests the credentials against the provider's API.
    - Output: `{ valid: boolean, error?: string }`

- **POST /api/providers**
    - Input: `{ provider: string, config: object }`
    - Action: Validates and saves the configuration (encrypted).

- **DELETE /api/providers/:provider**
    - Action: Removes the configuration for a provider.

### 4.2 Model Management

- **GET /api/models**
    - Returns a unified list of available models grouped by type (LLM, Embedding, etc.).
    - Only returns models from configured and valid providers.

- **GET /api/model-settings**
    - Returns the current default models for each type.

- **POST /api/model-settings**
    - Input: `{ modelType: string, provider: string, model: string }`
    - Action: Updates the default model for a specific type.

## 5. Security & Encryption

- **Encryption**: API keys and sensitive config must never be stored in plain text.
- **Algorithm**: AES-256-GCM.
- **Key Management**: A system-level `ENCRYPTION_KEY` (in `.env`) will be used to encrypt/decrypt `encryptedConfig`.

## 6. Backend Architecture

### 6.1 Module Structure
Create a new module `src/modules/model-provider`.

```
src/modules/model-provider/
├── model-provider.controller.ts
├── model-provider.service.ts
├── model-provider.module.ts
├── providers/
│   ├── base.provider.ts       // Abstract base class
│   ├── openai.provider.ts
│   ├── openrouter.provider.ts
│   └── ...
└── utils/
    └── encryption.util.ts
```

### 6.2 Provider Factory
A `ProviderFactory` will instantiate the correct provider class based on the provider name string.

### 6.3 Interface Definition
```typescript
interface ModelProvider {
  validate(config: any): Promise<boolean>;
  getModels(): Promise<ModelDefinition[]>;
  // Future: chat(), embed(), etc.
}
```

## 7. Frontend Design

### 7.1 Settings Page
- Add a "Model Providers" section in Tenant Settings.
- **List View**: Cards for each provider (OpenAI, OpenRouter, etc.) showing status (Configured/Not Configured).
- **Configuration Modal**: Form to input API Key and other settings (Base URL, etc.).
- **Default Model Selector**: Dropdowns for "System LLM", "Embedding Model", etc., populated by available models.

## 8. Implementation Steps

1.  **Database**: Update `schema.prisma` and run migrations.
2.  **Backend Core**: Implement `EncryptionUtil` and `ProviderConfig` CRUD.
3.  **Provider Logic**: Implement `OpenAIProvider`, `OpenRouterProvider`, etc.
4.  **API Layer**: Create controllers for providers and models.
5.  **Frontend**: Build the UI for configuration and selection.
