import axios from 'axios';
import { BaseProvider, ModelDefinition } from './base.provider';

interface SiliconFlowConfig {
    apiKey: string;
    baseUrl?: string;
}

export class SiliconFlowProvider extends BaseProvider {
    providerName = 'siliconflow';
    private readonly defaultBaseUrl = 'https://api.siliconflow.cn/v1';

    private getBaseUrl(config: SiliconFlowConfig) {
        return config.baseUrl?.trim() || this.defaultBaseUrl;
    }

    private resolveType(modelId: string): ModelDefinition['type'] {
        const id = modelId.toLowerCase();
        if (id.includes('embed') || id.includes('embedding')) return 'embedding';
        if (id.includes('rerank')) return 'rerank';
        if (id.includes('tts')) return 'tts';
        if (id.includes('asr') || id.includes('speech') || id.includes('whisper')) return 'speech_to_text';
        return 'llm';
    }

    private getRecommendedModels(): ModelDefinition[] {
        return [
            // DeepSeek series (Latest)
            { id: 'deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1', type: 'llm', provider: this.providerName },
            { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B', name: 'DeepSeek R1 Distill Qwen 32B', type: 'llm', provider: this.providerName },
            { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-14B', name: 'DeepSeek R1 Distill Qwen 14B', type: 'llm', provider: this.providerName },
            { id: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B', name: 'DeepSeek R1 Distill Qwen 7B', type: 'llm', provider: this.providerName },
            { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', type: 'llm', provider: this.providerName },
            { id: 'deepseek-ai/DeepSeek-V2.5', name: 'DeepSeek V2.5', type: 'llm', provider: this.providerName },
            { id: 'Pro/deepseek-ai/DeepSeek-R1', name: 'DeepSeek R1 (Pro)', type: 'llm', provider: this.providerName },
            { id: 'Pro/deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3 (Pro)', type: 'llm', provider: this.providerName },
            // Qwen series (Latest)
            { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B A22B', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen3-32B', name: 'Qwen3 32B', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen3-14B', name: 'Qwen3 14B', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen3-8B', name: 'Qwen3 8B', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen2.5-32B-Instruct', name: 'Qwen 2.5 32B Instruct', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen2.5-14B-Instruct', name: 'Qwen 2.5 14B Instruct', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B Instruct', type: 'llm', provider: this.providerName },
            { id: 'Qwen/Qwen2.5-Coder-32B-Instruct', name: 'Qwen 2.5 Coder 32B', type: 'llm', provider: this.providerName },
            { id: 'Pro/Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B (Pro)', type: 'llm', provider: this.providerName },
            // GLM series
            { id: 'THUDM/GLM-4-9B-0414', name: 'GLM-4 9B', type: 'llm', provider: this.providerName },
            { id: 'THUDM/GLM-Z1-32B-0414', name: 'GLM-Z1 32B', type: 'llm', provider: this.providerName },
            { id: 'THUDM/GLM-Z1-9B-0414', name: 'GLM-Z1 9B', type: 'llm', provider: this.providerName },
            // Other LLMs
            { id: 'internlm/internlm2_5-20b-chat', name: 'InternLM 2.5 20B Chat', type: 'llm', provider: this.providerName },
            { id: 'internlm/internlm2_5-7b-chat', name: 'InternLM 2.5 7B Chat', type: 'llm', provider: this.providerName },
            { id: '01-ai/Yi-1.5-34B-Chat', name: 'Yi 1.5 34B Chat', type: 'llm', provider: this.providerName },
            { id: '01-ai/Yi-1.5-9B-Chat', name: 'Yi 1.5 9B Chat', type: 'llm', provider: this.providerName },
            // Embedding models
            { id: 'BAAI/bge-m3', name: 'BGE M3', type: 'embedding', provider: this.providerName },
            { id: 'BAAI/bge-large-zh-v1.5', name: 'BGE Large Zh v1.5', type: 'embedding', provider: this.providerName },
            { id: 'BAAI/bge-large-en-v1.5', name: 'BGE Large En v1.5', type: 'embedding', provider: this.providerName },
            { id: 'Pro/BAAI/bge-m3', name: 'BGE M3 (Pro)', type: 'embedding', provider: this.providerName },
            { id: 'netease-youdao/bce-embedding-base_v1', name: 'BCE Embedding Base v1', type: 'embedding', provider: this.providerName },
            // Rerank models
            { id: 'BAAI/bge-reranker-v2-m3', name: 'BGE Reranker v2 M3', type: 'rerank', provider: this.providerName },
            { id: 'netease-youdao/bce-reranker-base_v1', name: 'BCE Reranker Base v1', type: 'rerank', provider: this.providerName },
            // TTS models
            { id: 'FunAudioLLM/CosyVoice2-0.5B', name: 'CosyVoice2 0.5B', type: 'tts', provider: this.providerName },
            { id: 'fishaudio/fish-speech-1.5', name: 'Fish Speech 1.5', type: 'tts', provider: this.providerName },
            // Speech to text
            { id: 'FunAudioLLM/SenseVoiceSmall', name: 'SenseVoice Small', type: 'speech_to_text', provider: this.providerName },
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

    private getHeaders(config: SiliconFlowConfig) {
        return {
            Authorization: `Bearer ${config.apiKey}`,
        };
    }

    async validate(config: SiliconFlowConfig): Promise<boolean> {
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

    async getModels(config: SiliconFlowConfig): Promise<ModelDefinition[]> {
        if (!config.apiKey) return [];
        try {
            const response = await axios.get(`${this.getBaseUrl(config)}/models`, {
                headers: this.getHeaders(config),
            });
            const models = response.data?.data || response.data?.models || [];
            const mapped = models.map((model: any) => {
                const modelId = model.id || model.name;
                return {
                    id: modelId,
                    name: model.name || modelId,
                    type: this.resolveType(modelId),
                    provider: this.providerName,
                };
            });

            return this.mergeWithRecommended(mapped);
        } catch (error) {
            console.error('Failed to fetch SiliconFlow models', error);
            return this.getRecommendedModels();
        }
    }
}
