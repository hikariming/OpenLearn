import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionUtil } from './utils/encryption.util';
import { BaseProvider, ModelDefinition } from './providers/base.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { SiliconFlowProvider } from './providers/siliconflow.provider';

interface ProviderModelRecord {
    id: string;
    tenantId: string;
    provider: string;
    model: string;
    displayName: string;
    modelType: ModelDefinition['type'];
    enabled: boolean;
    source: 'auto' | 'custom';
}

@Injectable()
export class ModelProviderService {
    private providers: Map<string, BaseProvider> = new Map();

    constructor(private prisma: PrismaService) {
        // Register providers
        const openai = new OpenAIProvider();
        const openRouter = new OpenRouterProvider();
        const gemini = new GeminiProvider();
        const siliconFlow = new SiliconFlowProvider();

        [openai, openRouter, gemini, siliconFlow].forEach(provider => {
            this.providers.set(provider.providerName, provider);
        });
    }

    getProvider(name: string): BaseProvider {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new BadRequestException(`Provider ${name} not supported`);
        }
        return provider;
    }

    async getSupportedProviders() {
        return Array.from(this.providers.keys());
    }

    async getTenantProviders(tenantId: string) {
        const configs = await this.prisma.providerConfig.findMany({
            where: { tenantId },
        });

        return configs.map(config => ({
            provider: config.provider,
            isValid: config.isValid,
            lastValidatedAt: config.lastValidatedAt,
        }));
    }

    async validateAndSaveProvider(tenantId: string, providerName: string, config: any) {
        const provider = this.getProvider(providerName);
        const isValid = await provider.validate(config);

        if (!isValid) {
            throw new BadRequestException('Invalid provider configuration');
        }

        const encryptedConfig = EncryptionUtil.encrypt(JSON.stringify(config));

        await this.prisma.providerConfig.upsert({
            where: {
                tenantId_provider: {
                    tenantId,
                    provider: providerName,
                },
            },
            update: {
                encryptedConfig,
                isValid: true,
                lastValidatedAt: new Date(),
            },
            create: {
                tenantId,
                provider: providerName,
                encryptedConfig,
                isValid: true,
                lastValidatedAt: new Date(),
            },
        });

        await this.refreshProviderModels(tenantId);

        return { success: true };
    }

    async deleteProvider(tenantId: string, providerName: string) {
        await this.prisma.tenantModelSetting.deleteMany({
            where: {
                tenantId,
                provider: providerName,
            },
        });
        await this.providerModelClient.deleteMany({
            where: {
                tenantId,
                provider: providerName,
            },
        });
        await this.prisma.providerConfig.delete({
            where: {
                tenantId_provider: {
                    tenantId,
                    provider: providerName,
                },
            },
        });
    }

    async getAvailableModels(tenantId: string) {
        const configuredProviders = await this.refreshProviderModels(tenantId);
        if (!configuredProviders.length) return [];

        const enabledModels = await this.providerModelClient.findMany({
            where: {
                tenantId,
                enabled: true,
                provider: {
                    in: configuredProviders,
                },
            },
            orderBy: [
                { provider: 'asc' },
                { displayName: 'asc' },
            ],
        }) as ProviderModelRecord[];

        return enabledModels.map((model: ProviderModelRecord) => this.mapDbModelToDefinition(model));
    }

    async getModelSettings(tenantId: string) {
        return this.prisma.tenantModelSetting.findMany({
            where: { tenantId },
        });
    }

    async updateModelSetting(tenantId: string, modelType: string, provider: string, model: string) {
        return this.prisma.tenantModelSetting.upsert({
            where: {
                tenantId_modelType: {
                    tenantId,
                    modelType,
                },
            },
            update: {
                provider,
                model,
            },
            create: {
                tenantId,
                modelType,
                provider,
                model,
            },
        });
    }

    async getProviderModelCatalog(tenantId: string) {
        await this.refreshProviderModels(tenantId);
        return this.providerModelClient.findMany({
            where: { tenantId },
            orderBy: [
                { provider: 'asc' },
                { displayName: 'asc' },
            ],
        });
    }

    async createCustomModel(tenantId: string, body: { provider: string; model: string; displayName?: string; modelType: string }) {
        const providerName = body.provider?.trim();
        const modelId = body.model?.trim();
        const modelType = body.modelType as ModelDefinition['type'];

        if (!providerName) throw new BadRequestException('Provider is required');
        if (!modelId) throw new BadRequestException('Model ID is required');
        if (!modelType) throw new BadRequestException('Model type is required');

        const allowedTypes: ModelDefinition['type'][] = ['llm', 'embedding', 'rerank', 'tts', 'speech_to_text'];
        if (!allowedTypes.includes(modelType)) {
            throw new BadRequestException('Invalid model type');
        }

        this.getProvider(providerName);

        const existing = await this.providerModelClient.findUnique({
            where: {
                tenantId_provider_model: {
                    tenantId,
                    provider: providerName,
                    model: modelId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Model already exists');
        }

        return this.providerModelClient.create({
            data: {
                tenantId,
                provider: providerName,
                model: modelId,
                displayName: body.displayName?.trim() || modelId,
                modelType,
                source: 'custom',
                enabled: true,
            },
        });
    }

    async updateTenantModel(
        tenantId: string,
        id: string,
        body: { enabled?: boolean; displayName?: string; modelType?: string }
    ) {
        const model = await this.providerModelClient.findUnique({
            where: { id },
        });

        if (!model || model.tenantId !== tenantId) {
            throw new BadRequestException('Model not found');
        }

        const data: Record<string, unknown> = {};
        if (typeof body.enabled === 'boolean') {
            data.enabled = body.enabled;
        }

        if (model.source === 'custom') {
            if (body.displayName) {
                data.displayName = body.displayName.trim();
            }
            if (body.modelType) {
                const allowedTypes: ModelDefinition['type'][] = ['llm', 'embedding', 'rerank', 'tts', 'speech_to_text'];
                if (!allowedTypes.includes(body.modelType as ModelDefinition['type'])) {
                    throw new BadRequestException('Invalid model type');
                }
                data.modelType = body.modelType;
            }
        }

        if (Object.keys(data).length === 0) {
            return model;
        }

        const updated = await this.providerModelClient.update({
            where: { id },
            data,
        });

        if (body.enabled === false) {
            await this.removeModelFromSettings(tenantId, model.provider, model.model);
        }

        return updated;
    }

    async deleteTenantModel(tenantId: string, id: string) {
        const model = await this.providerModelClient.findUnique({
            where: { id },
        });

        if (!model || model.tenantId !== tenantId) {
            throw new BadRequestException('Model not found');
        }

        if (model.source !== 'custom') {
            throw new BadRequestException('Only custom models can be deleted');
        }

        await this.removeModelFromSettings(tenantId, model.provider, model.model);

        await this.providerModelClient.delete({
            where: { id },
        });

        return { success: true };
    }

    private async refreshProviderModels(tenantId: string): Promise<string[]> {
        const configs = await this.prisma.providerConfig.findMany({
            where: { tenantId, isValid: true },
        });

        const configuredProviders = configs.map(config => config.provider);

        await Promise.all(configs.map(async (config) => {
            try {
                const decryptedConfig = JSON.parse(EncryptionUtil.decrypt(config.encryptedConfig));
                const provider = this.getProvider(config.provider);
                const models = await provider.getModels(decryptedConfig);
                await this.syncProviderModels(tenantId, config.provider, models);
            } catch (error) {
                console.error(`Failed to refresh models for provider ${config.provider}`, error);
            }
        }));

        return configuredProviders;
    }

    private async syncProviderModels(tenantId: string, providerName: string, models: ModelDefinition[]) {
        const existing = await this.providerModelClient.findMany({
            where: {
                tenantId,
                provider: providerName,
                source: 'auto',
            },
        }) as ProviderModelRecord[];

        const existingMap = new Map(existing.map(model => [model.model, model]));
        const seenIds = new Set<string>();
        const ops = [];
        const providerModels = this.providerModelClient;

        for (const model of models) {
            seenIds.add(model.id);
            const existingModel = existingMap.get(model.id);
            if (existingModel) {
                ops.push(providerModels.update({
                    where: { id: existingModel.id },
                    data: {
                        displayName: model.name,
                        modelType: model.type,
                    },
                }));
            } else {
                ops.push(providerModels.create({
                    data: {
                        tenantId,
                        provider: providerName,
                        model: model.id,
                        displayName: model.name,
                        modelType: model.type,
                        source: 'auto',
                        enabled: true,
                    },
                }));
            }
        }

        const staleIds = existing
            .filter(model => !seenIds.has(model.model))
            .map(model => model.id);

        if (staleIds.length > 0) {
            ops.push(providerModels.updateMany({
                where: { id: { in: staleIds } },
                data: { enabled: false },
            }));
        }

        if (ops.length > 0) {
            await this.prisma.$transaction(ops);
        }
    }

    private mapDbModelToDefinition(model: ProviderModelRecord): ModelDefinition {
        return {
            id: model.model,
            name: model.displayName,
            provider: model.provider,
            type: model.modelType as ModelDefinition['type'],
        };
    }

    private async removeModelFromSettings(tenantId: string, provider: string, model: string) {
        await this.prisma.tenantModelSetting.deleteMany({
            where: {
                tenantId,
                provider,
                model,
            },
        });
    }

    async getDecryptedConfig(tenantId: string, providerName: string) {
        const config = await this.prisma.providerConfig.findUnique({
            where: {
                tenantId_provider: {
                    tenantId,
                    provider: providerName,
                },
            },
        });

        if (!config) {
            return null;
        }

        return JSON.parse(EncryptionUtil.decrypt(config.encryptedConfig));
    }

    private get providerModelClient() {
        return (this.prisma as unknown as { tenantProviderModel: any }).tenantProviderModel;
    }
}
