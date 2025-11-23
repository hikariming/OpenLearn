export interface ModelDefinition {
    id: string;
    name: string;
    type: 'llm' | 'embedding' | 'rerank' | 'tts' | 'speech_to_text';
    provider: string;
}

export abstract class BaseProvider {
    abstract providerName: string;

    /**
     * Validate the provider configuration (e.g., API Key)
     */
    abstract validate(config: any): Promise<boolean>;

    /**
     * Get a list of available models from this provider
     */
    abstract getModels(config: any): Promise<ModelDefinition[]>;
}
