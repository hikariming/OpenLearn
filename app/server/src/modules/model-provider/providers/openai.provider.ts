import { BaseProvider, ModelDefinition } from './base.provider';
import axios from 'axios';

export class OpenAIProvider extends BaseProvider {
    providerName = 'openai';
    private readonly baseUrl = 'https://api.openai.com/v1';
    private getRecommendedModels(): ModelDefinition[] {
        return [
            // Latest flagship models
            { id: 'gpt-4.1', name: 'GPT-4.1', type: 'llm', provider: this.providerName },
            { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', type: 'llm', provider: this.providerName },
            { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', type: 'llm', provider: this.providerName },
            { id: 'gpt-4.5-preview', name: 'GPT-4.5 Preview (Orion)', type: 'llm', provider: this.providerName },
            // GPT-4o series
            { id: 'gpt-4o', name: 'GPT-4o', type: 'llm', provider: this.providerName },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'llm', provider: this.providerName },
            { id: 'chatgpt-4o-latest', name: 'ChatGPT-4o Latest', type: 'llm', provider: this.providerName },
            // Reasoning models (o-series)
            { id: 'o3', name: 'O3', type: 'llm', provider: this.providerName },
            { id: 'o3-mini', name: 'O3 Mini', type: 'llm', provider: this.providerName },
            { id: 'o4-mini', name: 'O4 Mini', type: 'llm', provider: this.providerName },
            { id: 'o1', name: 'O1', type: 'llm', provider: this.providerName },
            { id: 'o1-mini', name: 'O1 Mini', type: 'llm', provider: this.providerName },
            { id: 'o1-preview', name: 'O1 Preview', type: 'llm', provider: this.providerName },
            // Legacy GPT-4 models
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', type: 'llm', provider: this.providerName },
            { id: 'gpt-4', name: 'GPT-4', type: 'llm', provider: this.providerName },
            // Embedding models
            { id: 'text-embedding-3-large', name: 'Text Embedding 3 Large', type: 'embedding', provider: this.providerName },
            { id: 'text-embedding-3-small', name: 'Text Embedding 3 Small', type: 'embedding', provider: this.providerName },
            { id: 'text-embedding-ada-002', name: 'Text Embedding Ada 002', type: 'embedding', provider: this.providerName },
            // TTS models
            { id: 'tts-1', name: 'TTS-1', type: 'tts', provider: this.providerName },
            { id: 'tts-1-hd', name: 'TTS-1 HD', type: 'tts', provider: this.providerName },
            { id: 'gpt-4o-mini-tts', name: 'GPT-4o Mini TTS', type: 'tts', provider: this.providerName },
            // Speech to text
            { id: 'whisper-1', name: 'Whisper v1', type: 'speech_to_text', provider: this.providerName },
            { id: 'gpt-4o-transcribe', name: 'GPT-4o Transcribe', type: 'speech_to_text', provider: this.providerName },
            { id: 'gpt-4o-mini-transcribe', name: 'GPT-4o Mini Transcribe', type: 'speech_to_text', provider: this.providerName },
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

    async validate(config: any): Promise<boolean> {
        if (!config.apiKey) return false;
        try {
            await axios.get(`${this.baseUrl}/models`, {
                headers: { Authorization: `Bearer ${config.apiKey}` },
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    async getModels(config: any): Promise<ModelDefinition[]> {
        if (!config.apiKey) return [];
        try {
            const response = await axios.get(`${this.baseUrl}/models`, {
                headers: { Authorization: `Bearer ${config.apiKey}` },
            });

            const apiModels = response.data.data
                .filter((model: any) => 
                    model.id.includes('gpt') || 
                    model.id.includes('embedding') || 
                    model.id.includes('tts') || 
                    model.id.includes('whisper') ||
                    model.id.startsWith('o1') ||
                    model.id.startsWith('o3') ||
                    model.id.startsWith('o4') ||
                    model.id.includes('transcribe')
                )
                .map((model: any) => {
                    let type: ModelDefinition['type'] = 'llm';
                    if (model.id.includes('embedding')) type = 'embedding';
                    else if (model.id.includes('tts')) type = 'tts';
                    else if (model.id.includes('whisper')) type = 'speech_to_text';

                    return {
                        id: model.id,
                        name: model.id,
                        type,
                        provider: this.providerName,
                    };
                });

            return this.mergeWithRecommended(apiModels);
        } catch (error) {
            console.error('Failed to fetch OpenAI models', error);
            return this.getRecommendedModels();
        }
    }
}
