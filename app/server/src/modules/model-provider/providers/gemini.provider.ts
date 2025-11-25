import axios from 'axios';
import { BaseProvider, ModelDefinition } from './base.provider';

interface GeminiConfig {
    apiKey: string;
    baseUrl?: string;
}

export class GeminiProvider extends BaseProvider {
    providerName = 'gemini';
    private readonly defaultBaseUrl = 'https://generativelanguage.googleapis.com/v1beta';

    private getBaseUrl(config: GeminiConfig) {
        return config.baseUrl?.trim() || this.defaultBaseUrl;
    }

    private resolveType(model: any): ModelDefinition['type'] {
        const methods: string[] = model.supportedGenerationMethods || [];
        const modelName: string = (model.name || '').toLowerCase();

        if (methods.includes('embedContent') || modelName.includes('embedding')) {
            return 'embedding';
        }

        if (methods.includes('speech') || modelName.includes('speech')) {
            return 'speech_to_text';
        }

        return 'llm';
    }

    private getRecommendedModels(): ModelDefinition[] {
        return [
            // Gemini 2.5 series (Latest)
            { id: 'gemini-2.5-pro-preview-05-06', name: 'Gemini 2.5 Pro Preview', type: 'llm', provider: this.providerName },
            { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', type: 'llm', provider: this.providerName },
            // Gemini 2.0 series
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'llm', provider: this.providerName },
            { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', type: 'llm', provider: this.providerName },
            { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', type: 'llm', provider: this.providerName },
            // Gemini 1.5 series
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', type: 'llm', provider: this.providerName },
            { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro Latest', type: 'llm', provider: this.providerName },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', type: 'llm', provider: this.providerName },
            { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash Latest', type: 'llm', provider: this.providerName },
            { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', type: 'llm', provider: this.providerName },
            // Embedding models
            { id: 'text-embedding-004', name: 'Text Embedding 004', type: 'embedding', provider: this.providerName },
            { id: 'text-embedding-005', name: 'Text Embedding 005', type: 'embedding', provider: this.providerName },
            { id: 'embedding-001', name: 'Embedding 001', type: 'embedding', provider: this.providerName },
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

    async validate(config: GeminiConfig): Promise<boolean> {
        if (!config.apiKey) return false;
        try {
            await axios.get(`${this.getBaseUrl(config)}/models`, {
                params: { key: config.apiKey },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async getModels(config: GeminiConfig): Promise<ModelDefinition[]> {
        if (!config.apiKey) return [];

        try {
            const response = await axios.get(`${this.getBaseUrl(config)}/models`, {
                params: { key: config.apiKey },
            });

            const data = response.data?.models || [];
            const mapped = data.map((model: any) => {
                const rawName: string = model.name || '';
                const cleanName = rawName.startsWith('models/') ? rawName.replace('models/', '') : rawName;
                return {
                    id: cleanName,
                    name: model.displayName || cleanName,
                    type: this.resolveType(model),
                    provider: this.providerName,
                };
            });

            return this.mergeWithRecommended(mapped);
        } catch (error) {
            console.error('Failed to fetch Gemini models', error);
            return this.getRecommendedModels();
        }
    }
}
