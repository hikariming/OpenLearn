import axios from 'axios';
import { BaseProvider, ModelDefinition } from './base.provider';

interface OpenRouterConfig {
    apiKey: string;
    baseUrl?: string;
    appName?: string;
    siteUrl?: string;
}

export class OpenRouterProvider extends BaseProvider {
    providerName = 'openrouter';
    private readonly defaultBaseUrl = 'https://openrouter.ai/api/v1';

    private getBaseUrl(config: OpenRouterConfig) {
        return config.baseUrl?.trim() || this.defaultBaseUrl;
    }

    private getHeaders(config: OpenRouterConfig) {
        const headers: Record<string, string> = {
            Authorization: `Bearer ${config.apiKey}`,
        };
        if (config.siteUrl) headers['HTTP-Referer'] = config.siteUrl;
        if (config.appName) headers['X-Title'] = config.appName;
        return headers;
    }

    private resolveType(modelId: string): ModelDefinition['type'] {
        const id = modelId.toLowerCase();
        if (id.includes('embed') || id.includes('embedding')) return 'embedding';
        if (id.includes('rerank')) return 'rerank';
        if (id.includes('tts') || id.includes('speech')) return 'tts';
        if (id.includes('whisper') || id.includes('transcribe')) return 'speech_to_text';
        return 'llm';
    }

    private getRecommendedModels(): ModelDefinition[] {
        return [
            // Anthropic Claude series (Latest)
            { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', type: 'llm', provider: this.providerName },
            { id: 'anthropic/claude-4-opus', name: 'Claude 4 Opus', type: 'llm', provider: this.providerName },
            { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', type: 'llm', provider: this.providerName },
            { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', type: 'llm', provider: this.providerName },
            { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', type: 'llm', provider: this.providerName },
            { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', type: 'llm', provider: this.providerName },
            // Google Gemini series
            { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro Preview', type: 'llm', provider: this.providerName },
            { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash Preview', type: 'llm', provider: this.providerName },
            { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'llm', provider: this.providerName },
            { id: 'google/gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', type: 'llm', provider: this.providerName },
            { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', type: 'llm', provider: this.providerName },
            { id: 'google/gemini-flash-1.5', name: 'Gemini 1.5 Flash', type: 'llm', provider: this.providerName },
            // OpenAI series
            { id: 'openai/gpt-4.1', name: 'GPT-4.1', type: 'llm', provider: this.providerName },
            { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', type: 'llm', provider: this.providerName },
            { id: 'openai/gpt-4.5-preview', name: 'GPT-4.5 Preview', type: 'llm', provider: this.providerName },
            { id: 'openai/gpt-4o', name: 'GPT-4o', type: 'llm', provider: this.providerName },
            { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', type: 'llm', provider: this.providerName },
            { id: 'openai/o3-mini', name: 'O3 Mini', type: 'llm', provider: this.providerName },
            { id: 'openai/o1', name: 'O1', type: 'llm', provider: this.providerName },
            { id: 'openai/o1-mini', name: 'O1 Mini', type: 'llm', provider: this.providerName },
            // DeepSeek series
            { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', type: 'llm', provider: this.providerName },
            { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (V3)', type: 'llm', provider: this.providerName },
            { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', type: 'llm', provider: this.providerName },
            // Meta Llama series
            { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', type: 'llm', provider: this.providerName },
            { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', type: 'llm', provider: this.providerName },
            { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', type: 'llm', provider: this.providerName },
            { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B Instruct', type: 'llm', provider: this.providerName },
            { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B Instruct', type: 'llm', provider: this.providerName },
            // Mistral series
            { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 24.11', type: 'llm', provider: this.providerName },
            { id: 'mistralai/mistral-medium', name: 'Mistral Medium', type: 'llm', provider: this.providerName },
            { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1 24B', type: 'llm', provider: this.providerName },
            { id: 'mistralai/codestral-latest', name: 'Codestral Latest', type: 'llm', provider: this.providerName },
            // Qwen series
            { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B A22B', type: 'llm', provider: this.providerName },
            { id: 'qwen/qwen3-32b', name: 'Qwen3 32B', type: 'llm', provider: this.providerName },
            { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', type: 'llm', provider: this.providerName },
            { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', type: 'llm', provider: this.providerName },
            // xAI Grok
            { id: 'x-ai/grok-3', name: 'Grok 3', type: 'llm', provider: this.providerName },
            { id: 'x-ai/grok-3-mini', name: 'Grok 3 Mini', type: 'llm', provider: this.providerName },
            { id: 'x-ai/grok-2', name: 'Grok 2', type: 'llm', provider: this.providerName },
            // Embedding models
            { id: 'voyage/voyage-3-large', name: 'Voyage 3 Large', type: 'embedding', provider: this.providerName },
            { id: 'voyage/voyage-3', name: 'Voyage 3', type: 'embedding', provider: this.providerName },
            { id: 'voyage/voyage-3-lite', name: 'Voyage 3 Lite', type: 'embedding', provider: this.providerName },
            { id: 'cohere/embed-english-v3.0', name: 'Cohere Embed Eng v3', type: 'embedding', provider: this.providerName },
            { id: 'cohere/embed-multilingual-v3.0', name: 'Cohere Embed Multilingual v3', type: 'embedding', provider: this.providerName },
            // Rerank models
            { id: 'jina/jina-reranker-v2-base-multilingual', name: 'Jina Reranker v2 Base', type: 'rerank', provider: this.providerName },
            { id: 'cohere/rerank-english-v3.0', name: 'Cohere Rerank Eng v3', type: 'rerank', provider: this.providerName },
            { id: 'cohere/rerank-multilingual-v3.0', name: 'Cohere Rerank Multilingual v3', type: 'rerank', provider: this.providerName },
        ];
    }

    private mergeWithRecommended(models: ModelDefinition[]): ModelDefinition[] {
        const seen = new Set(models.map(model => model.id));
        const merged = [...models];
        for (const recommended of this.getRecommendedModels()) {
            if (!seen.has(recommended.id)) {
                merged.push(recommended);
            }
        }
        return merged;
    }

    async validate(config: OpenRouterConfig): Promise<boolean> {
        if (!config.apiKey) return false;
        try {
            await axios.get(`${this.getBaseUrl(config)}/models`, {
                headers: this.getHeaders(config),
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async getModels(config: OpenRouterConfig): Promise<ModelDefinition[]> {
        if (!config.apiKey) return [];

        try {
            const response = await axios.get(`${this.getBaseUrl(config)}/models`, {
                headers: this.getHeaders(config),
            });

            const data = response.data?.data || [];
            const mapped = data.map((model: any) => {
                const modelId = model.id || model.slug || model.name;
                return {
                    id: modelId,
                    name: model.name || modelId,
                    type: this.resolveType(modelId),
                    provider: this.providerName,
                };
            });

            return this.mergeWithRecommended(mapped);
        } catch (error) {
            console.error('Failed to fetch OpenRouter models', error);
            return this.getRecommendedModels();
        }
    }
}
