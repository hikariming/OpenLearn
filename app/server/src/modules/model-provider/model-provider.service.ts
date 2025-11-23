import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionUtil } from './utils/encryption.util';
import { BaseProvider, ModelDefinition } from './providers/base.provider';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class ModelProviderService {
    private providers: Map<string, BaseProvider> = new Map();

    constructor(private prisma: PrismaService) {
        // Register providers
        const openai = new OpenAIProvider();
        this.providers.set(openai.providerName, openai);
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

        return { success: true };
    }

    async deleteProvider(tenantId: string, providerName: string) {
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
        const configs = await this.prisma.providerConfig.findMany({
            where: { tenantId, isValid: true },
        });

        let allModels: ModelDefinition[] = [];

        for (const config of configs) {
            try {
                const decryptedConfig = JSON.parse(EncryptionUtil.decrypt(config.encryptedConfig));
                const provider = this.getProvider(config.provider);
                const models = await provider.getModels(decryptedConfig);
                allModels = [...allModels, ...models];
            } catch (error) {
                console.error(`Failed to load models for provider ${config.provider}`, error);
            }
        }

        return allModels;
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
}
