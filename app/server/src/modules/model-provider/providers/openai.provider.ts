import { BaseProvider, ModelDefinition } from './base.provider';
import axios from 'axios';

export class OpenAIProvider extends BaseProvider {
    providerName = 'openai';
    private readonly baseUrl = 'https://api.openai.com/v1';

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

            return response.data.data
                .filter((model: any) => model.id.includes('gpt') || model.id.includes('embedding') || model.id.includes('tts') || model.id.includes('whisper'))
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
        } catch (error) {
            console.error('Failed to fetch OpenAI models', error);
            return [];
        }
    }
}
