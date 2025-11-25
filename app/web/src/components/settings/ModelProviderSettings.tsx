import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { X, Eye, EyeOff, Brain, Database, ListOrdered, Mic, Volume2, Settings2, Plus, Power, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import ProviderCard from './ProviderCard';
import ModelSelector from './ModelSelector';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface Provider {
    provider: string;
    isValid: boolean;
    lastValidatedAt?: string;
}

interface ModelSetting {
    modelType: string;
    provider: string;
    model: string;
}

type ModelCategory = 'llm' | 'embedding' | 'rerank' | 'tts' | 'speech_to_text';

interface CatalogModel {
    id: string;
    provider: string;
    model: string;
    displayName: string;
    modelType: ModelCategory;
    source: 'auto' | 'custom';
    enabled: boolean;
}

interface ModelOption {
    provider: string;
    model: string;
    label: string;
}

interface CustomModelForm {
    model: string;
    displayName: string;
    modelType: ModelCategory;
}

type ProviderConfigKey = 'apiKey' | 'baseUrl' | 'siteUrl' | 'appName';

interface ProviderField {
    key: ProviderConfigKey;
    label: string;
    placeholder?: string;
    optional?: boolean;
}

interface SupportedProvider {
    id: string;
    name: string;
    fields?: ProviderField[];
}

type ProviderConfigValues = Record<ProviderConfigKey, string>;

export default function ModelProviderSettings() {
    const t = useTranslations('ModelProvider');
    const tCommon = useTranslations('Common');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [settings, setSettings] = useState<ModelSetting[]>([]);
    const [modelCatalog, setModelCatalog] = useState<CatalogModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeProvider, setActiveProvider] = useState<string>('openai');
    const [modelMutations, setModelMutations] = useState<Record<string, boolean>>({});
    const [creatingCustom, setCreatingCustom] = useState(false);
    const [customModelForm, setCustomModelForm] = useState<CustomModelForm>({
        model: '',
        displayName: '',
        modelType: 'llm',
    });

    // Configuration Modal State
    const [configuringProvider, setConfiguringProvider] = useState<string | null>(null);
    const createDefaultConfigValues = (): ProviderConfigValues => ({
        apiKey: '',
        baseUrl: '',
        siteUrl: '',
        appName: '',
    });
    const [configValues, setConfigValues] = useState<ProviderConfigValues>(createDefaultConfigValues);
    const [showApiKey, setShowApiKey] = useState(false);

    // Delete Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const supportedProviders: SupportedProvider[] = useMemo(() => ([
        {
            id: 'openai',
            name: t('providerNames.openai'),
            fields: [
                {
                    key: 'baseUrl',
                    label: `${t('baseUrl')} (${t('optional')})`,
                    placeholder: 'https://api.openai.com/v1',
                    optional: true,
                },
            ],
        },
        {
            id: 'openrouter',
            name: t('providerNames.openrouter'),
            fields: [
                {
                    key: 'baseUrl',
                    label: `${t('baseUrl')} (${t('optional')})`,
                    placeholder: 'https://openrouter.ai/api/v1',
                    optional: true,
                },
                {
                    key: 'siteUrl',
                    label: `${t('fields.siteUrl')} (${t('optional')})`,
                    placeholder: 'https://yourapp.com',
                    optional: true,
                },
                {
                    key: 'appName',
                    label: `${t('fields.appName')} (${t('optional')})`,
                    placeholder: 'My AI App',
                    optional: true,
                },
            ],
        },
        {
            id: 'gemini',
            name: t('providerNames.gemini'),
            fields: [
                {
                    key: 'baseUrl',
                    label: `${t('baseUrl')} (${t('optional')})`,
                    placeholder: 'https://generativelanguage.googleapis.com/v1beta',
                    optional: true,
                },
            ],
        },
        {
            id: 'siliconflow',
            name: t('providerNames.siliconflow'),
            fields: [
                {
                    key: 'baseUrl',
                    label: `${t('baseUrl')} (${t('optional')})`,
                    placeholder: 'https://api.siliconflow.cn/v1',
                    optional: true,
                },
            ],
        },
    ]), [t]);

    useEffect(() => {
        if (!supportedProviders.find(p => p.id === activeProvider) && supportedProviders.length > 0) {
            setActiveProvider(supportedProviders[0].id);
        }
    }, [supportedProviders, activeProvider]);

    const currentProviderConfig = configuringProvider
        ? supportedProviders.find(p => p.id === configuringProvider)
        : null;

    const closeConfigModal = () => {
        setConfiguringProvider(null);
        setConfigValues(createDefaultConfigValues());
        setShowApiKey(false);
    };

    const modelTypes = [
        { id: 'llm', name: t('modelType.llm'), icon: Brain, color: 'text-purple-500 bg-purple-50' },
        { id: 'embedding', name: t('modelType.embedding'), icon: Database, color: 'text-blue-500 bg-blue-50' },
        { id: 'rerank', name: t('modelType.rerank'), icon: ListOrdered, color: 'text-orange-500 bg-orange-50' },
        { id: 'tts', name: t('modelType.tts'), icon: Volume2, color: 'text-pink-500 bg-pink-50' },
        { id: 'speech', name: t('modelType.speech'), icon: Mic, color: 'text-green-500 bg-green-50' },
    ];

    const modelCategoryOptions: { id: ModelCategory; name: string }[] = [
        { id: 'llm', name: t('modelType.llm') },
        { id: 'embedding', name: t('modelType.embedding') },
        { id: 'rerank', name: t('modelType.rerank') },
        { id: 'tts', name: t('modelType.tts') },
        { id: 'speech_to_text', name: t('modelType.speech') },
    ];

    const typeLabelMap = useMemo<Record<ModelCategory, string>>(() => ({
        llm: t('modelType.llm'),
        embedding: t('modelType.embedding'),
        rerank: t('modelType.rerank'),
        tts: t('modelType.tts'),
        speech_to_text: t('modelType.speech'),
    }), [t]);

    const getModelOptionsForType = useCallback((modelType: string): ModelOption[] => {
        if (modelCatalog.length === 0) return [];
        const configuredProviders = new Set(providers.filter(p => p.isValid).map(p => p.provider));
        // Map UI model type to database model type
        const dbModelType = modelType === 'speech' ? 'speech_to_text' : modelType;
        return modelCatalog
            .filter(model => model.enabled && configuredProviders.has(model.provider) && model.modelType === dbModelType)
            .map(model => ({
                provider: model.provider,
                model: model.model,
                label: model.displayName,
            }));
    }, [modelCatalog, providers]);

    const availableModelOptions = useMemo<ModelOption[]>(() => {
        if (modelCatalog.length === 0) return [];
        const configuredProviders = new Set(providers.filter(p => p.isValid).map(p => p.provider));
        return modelCatalog
            .filter(model => model.enabled && configuredProviders.has(model.provider))
            .map(model => ({
                provider: model.provider,
                model: model.model,
                label: model.displayName,
            }));
    }, [modelCatalog, providers]);

    const providerModelCounts = useMemo(() => {
        const counts: Record<string, { total: number; enabled: number }> = {};
        modelCatalog.forEach(model => {
            if (!counts[model.provider]) {
                counts[model.provider] = { total: 0, enabled: 0 };
            }
            counts[model.provider].total += 1;
            if (model.enabled) counts[model.provider].enabled += 1;
        });
        return counts;
    }, [modelCatalog]);

    const activeProviderModels = useMemo(
        () => modelCatalog.filter(model => model.provider === activeProvider),
        [modelCatalog, activeProvider]
    );

    const activeProviderConnected = useMemo(
        () => providers.some(provider => provider.provider === activeProvider && provider.isValid),
        [providers, activeProvider]
    );


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [providersRes, settingsRes, catalogRes] = await Promise.all([
                api.get('/model-providers'),
                api.get('/model-providers/settings'),
                api.get('/model-providers/catalog'),
            ]);
            setProviders(providersRes.data);
            setSettings(settingsRes.data);
            setModelCatalog(catalogRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setMessage({ type: 'error', text: t('fetchError') });
        } finally {
            setLoading(false);
        }
    }, [t]);

    const refreshCatalog = useCallback(async () => {
        try {
            const catalogRes = await api.get('/model-providers/catalog');
            setModelCatalog(catalogRes.data);
        } catch (error) {
            console.error('Failed to refresh catalog:', error);
            setMessage({ type: 'error', text: t('catalogRefreshError') });
        }
    }, [t]);

    const setModelMutating = useCallback((id: string, value: boolean) => {
        setModelMutations(prev => ({ ...prev, [id]: value }));
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configuringProvider) return;

        setSaving(true);
        setMessage(null);

        try {
            const payload: Record<string, string> = {
                apiKey: configValues.apiKey.trim(),
            };
            (['baseUrl', 'siteUrl', 'appName'] as ProviderConfigKey[]).forEach((key) => {
                const value = configValues[key]?.trim();
                if (value) {
                    payload[key] = value;
                }
            });

            await api.post('/model-providers', {
                provider: configuringProvider,
                config: payload,
            });
            setMessage({ type: 'success', text: t('saveSuccess') });
            closeConfigModal();
            fetchData();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('saveError') });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSetting = async (modelType: string, provider: string, model: string) => {
        try {
            await api.post('/model-providers/settings', {
                modelType,
                provider,
                model,
            });
            setSettings(prev => {
                const newSettings = [...prev];
                const index = newSettings.findIndex(s => s.modelType === modelType);
                if (index >= 0) {
                    newSettings[index] = { ...newSettings[index], provider, model };
                } else {
                    newSettings.push({ modelType, provider, model });
                }
                return newSettings;
            });
            setMessage({ type: 'success', text: t('settingUpdateSuccess') });
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('settingUpdateError') });
            fetchData();
        }
    };

    const handleToggleModel = async (modelId: string, enabled: boolean) => {
        setModelMutating(modelId, true);
        setMessage(null);
        try {
            await api.patch(`/model-providers/models/${modelId}`, { enabled });
            setModelCatalog(prev => prev.map(model => model.id === modelId ? { ...model, enabled } : model));
            setMessage({ type: 'success', text: enabled ? t('modelEnabled') : t('modelDisabled') });
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('modelToggleError') });
            await refreshCatalog();
        } finally {
            setModelMutating(modelId, false);
        }
    };

    const handleDeleteModel = async (modelId: string) => {
        setModelMutating(modelId, true);
        setMessage(null);
        try {
            await api.delete(`/model-providers/models/${modelId}`);
            setModelCatalog(prev => prev.filter(model => model.id !== modelId));
            setMessage({ type: 'success', text: t('customModelDeleted') });
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('customModelDeleteError') });
        } finally {
            setModelMutating(modelId, false);
        }
    };

    const handleAddCustomModel = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!customModelForm.model.trim()) {
            setMessage({ type: 'error', text: t('customModelIdRequired') });
            return;
        }
        setCreatingCustom(true);
        setMessage(null);
        try {
            await api.post('/model-providers/models/custom', {
                provider: activeProvider,
                model: customModelForm.model.trim(),
                displayName: customModelForm.displayName.trim() || undefined,
                modelType: customModelForm.modelType,
            });
            setMessage({ type: 'success', text: t('customModelAdded') });
            setCustomModelForm(prev => ({
                ...prev,
                model: '',
                displayName: '',
            }));
            await refreshCatalog();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('customModelAddError') });
        } finally {
            setCreatingCustom(false);
        }
    };

    const initiateDeleteProvider = (providerName: string) => {
        setDeletingProvider(providerName);
        setShowDeleteConfirm(true);
    };

    const handleDeleteProvider = async () => {
        if (!deletingProvider) return;
        setDeleteLoading(true);
        try {
            await api.delete(`/model-providers/${deletingProvider}`);
            setMessage({ type: 'success', text: t('deleteSuccess') });
            setShowDeleteConfirm(false);
            setDeletingProvider(null);
            fetchData();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('deleteError') });
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">{t('loading')}</div>;

    return (
        <div className="space-y-8">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* System Model Defaults */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Settings2 className="w-4 h-4 text-gray-500" />
                    {t('defaultModels')}
                </h3>
                <div className="space-y-4">
                    {modelTypes.map(type => {
                        const currentSetting = settings.find(s => s.modelType === type.id);
                        const currentModelId = currentSetting ? `${currentSetting.provider}:${currentSetting.model}` : '';
                        const Icon = type.icon;
                        const typeOptions = getModelOptionsForType(type.id);

                        return (
                            <div key={type.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <ModelSelector
                                        label={type.name}
                                        value={currentModelId}
                                        options={typeOptions}
                                        onChange={(val) => {
                                            const [provider, model] = val.split(':');
                                            if (provider && model) {
                                                handleUpdateSetting(type.id, provider, model);
                                            }
                                        }}
                                        disabled={typeOptions.length === 0}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Provider Grid */}
            <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">{t('providers')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supportedProviders.map(p => (
                        <ProviderCard
                            key={p.id}
                            provider={p}
                            isConnected={!!providers.find(Pp => Pp.provider === p.id && Pp.isValid)}
                            onConfigure={() => {
                                setConfiguringProvider(p.id);
                                setConfigValues(createDefaultConfigValues());
                                setShowApiKey(false);
                            }}
                            onDelete={
                                providers.find(Pp => Pp.provider === p.id && Pp.isValid)
                                    ? () => initiateDeleteProvider(p.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Model Catalog */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
                            <ListOrdered className="w-4 h-4 text-gray-500" />
                            {t('modelCatalogTitle')}
                        </h3>
                        <p className="text-xs text-gray-500">{t('modelCatalogDesc')}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Power className={`w-4 h-4 ${availableModelOptions.length > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span>{t('modelCatalogEnabled', { count: availableModelOptions.length })}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    {supportedProviders.map((provider) => {
                        const isActive = activeProvider === provider.id;
                        const counts = providerModelCounts[provider.id] || { total: 0, enabled: 0 };
                        const isConnected = providers.some(p => p.provider === provider.id && p.isValid);
                        return (
                            <button
                                key={provider.id}
                                type="button"
                                className={`px-4 py-2 rounded-lg border text-sm transition-all ${isActive ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-gray-200'}`}
                                onClick={() => setActiveProvider(provider.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">{provider.name}</span>
                                    {!isConnected && (
                                        <span className="text-[10px] uppercase tracking-wide text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                            {t('providerDisconnected')}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {t('providerModelCount', { enabled: counts.enabled, total: counts.total })}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-3">
                    {activeProviderModels.length > 0 ? (
                        activeProviderModels.map(model => (
                            <div key={model.id} className="flex flex-wrap items-center justify-between gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{model.displayName}</p>
                                    <p className="text-xs text-gray-500">{model.model}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-600">
                                        {typeLabelMap[model.modelType]}
                                    </span>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${model.source === 'custom' ? 'bg-purple-50 text-purple-600' : 'bg-gray-50 text-gray-500'}`}>
                                        {t(`modelSource.${model.source}`)}
                                    </span>
                                    <label className={`inline-flex items-center cursor-pointer ${modelMutations[model.id] ? 'opacity-60' : ''}`}>
                                        <span className="sr-only">{t('toggleModel')}</span>
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={model.enabled}
                                            disabled={!!modelMutations[model.id]}
                                            onChange={(e) => handleToggleModel(model.id, e.target.checked)}
                                        />
                                        <span className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${model.enabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            <span className={`h-4 w-4 bg-white rounded-full shadow transform transition-transform ${model.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </span>
                                    </label>
                                    {model.source === 'custom' && (
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteModel(model.id)}
                                            disabled={!!modelMutations[model.id]}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title={t('delete')}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                            {activeProviderConnected ? t('modelListEmpty') : t('connectProviderTip')}
                        </div>
                    )}
                </div>

                <div className="mt-6 border-t border-gray-100 pt-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4 text-gray-500" />
                        {t('addCustomModelTitle')}
                    </h4>
                    {activeProviderConnected ? (
                        <form className="space-y-4" onSubmit={handleAddCustomModel}>
                            <div className="grid md:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t('customModelIdLabel')}</label>
                                    <input
                                        type="text"
                                        value={customModelForm.model}
                                        onChange={(e) => setCustomModelForm(prev => ({ ...prev, model: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder="my-model-id"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t('customModelNameLabel')}</label>
                                    <input
                                        type="text"
                                        value={customModelForm.displayName}
                                        onChange={(e) => setCustomModelForm(prev => ({ ...prev, displayName: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        placeholder={t('customModelNamePlaceholder')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">{t('customModelTypeLabel')}</label>
                                    <select
                                        value={customModelForm.modelType}
                                        onChange={(e) => setCustomModelForm(prev => ({ ...prev, modelType: e.target.value as ModelCategory }))}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        {modelCategoryOptions.map(option => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    disabled={creatingCustom}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {creatingCustom ? t('modelActions.adding') : t('modelActions.addCustom')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomModelForm(prev => ({ ...prev, model: '', displayName: '' }))}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="text-sm text-gray-500">{t('connectProviderBeforeCustom')}</p>
                    )}
                </div>
            </div>

            {/* Configuration Modal */}
            {configuringProvider && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                {t('configure')} {currentProviderConfig?.name}
                            </h3>
                            <button
                                onClick={closeConfigModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProvider} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={configValues.apiKey}
                                        onChange={(e) => setConfigValues(prev => ({ ...prev, apiKey: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-10"
                                        placeholder="sk-..."
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {currentProviderConfig?.fields?.map((field) => (
                                <div key={`${currentProviderConfig.id}-${field.key}`}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label}
                                        {!field.optional && (
                                            <span className="text-red-500">*</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={configValues[field.key]}
                                        onChange={(e) => setConfigValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        placeholder={field.placeholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        required={!field.optional}
                                    />
                                </div>
                            ))}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? t('saving') : t('save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeConfigModal}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setDeletingProvider(null);
                }}
                onConfirm={handleDeleteProvider}
                title={t('confirmDelete')}
                description={deletingProvider ? t('confirmDeleteDesc', { provider: deletingProvider }) : ''}
                confirmText={tCommon('delete')}
                cancelText={tCommon('cancel')}
                isDangerous
                isLoading={deleteLoading}
            />
        </div>
    );
}
