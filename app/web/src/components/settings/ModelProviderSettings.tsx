import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Eye, EyeOff, Brain, Database, ListOrdered, Mic, Volume2, Settings2 } from 'lucide-react';
import api from '@/lib/api';
import ProviderCard from './ProviderCard';
import ModelSelector from './ModelSelector';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface Provider {
    provider: string;
    config: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface ModelSetting {
    modelType: string;
    provider: string;
    model: string;
}

export default function ModelProviderSettings() {
    const t = useTranslations('ModelProvider');
    const [providers, setProviders] = useState<Provider[]>([]);
    const [settings, setSettings] = useState<ModelSetting[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [availableModels, setAvailableModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Configuration Modal State
    const [configuringProvider, setConfiguringProvider] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [showApiKey, setShowApiKey] = useState(false);

    // Delete Confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletingProvider, setDeletingProvider] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const supportedProviders = [
        { id: 'openai', name: 'OpenAI' },
        // Add more as implemented
    ];

    const modelTypes = [
        { id: 'llm', name: t('modelType.llm'), icon: Brain, color: 'text-purple-500 bg-purple-50' },
        { id: 'embedding', name: t('modelType.embedding'), icon: Database, color: 'text-blue-500 bg-blue-50' },
        { id: 'rerank', name: t('modelType.rerank'), icon: ListOrdered, color: 'text-orange-500 bg-orange-50' },
        { id: 'tts', name: t('modelType.tts'), icon: Volume2, color: 'text-pink-500 bg-pink-50' },
        { id: 'speech', name: t('modelType.speech'), icon: Mic, color: 'text-green-500 bg-green-50' },
    ];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [providersRes, settingsRes, modelsRes] = await Promise.all([
                api.get('/model-providers'),
                api.get('/model-providers/settings'),
                api.get('/model-providers/models'),
            ]);
            setProviders(providersRes.data);
            setSettings(settingsRes.data);
            setAvailableModels(modelsRes.data);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setMessage({ type: 'error', text: t('fetchError') });
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!configuringProvider) return;

        setSaving(true);
        setMessage(null);

        try {
            await api.post('/model-providers', {
                provider: configuringProvider,
                config: {
                    apiKey,
                    baseUrl: baseUrl || undefined,
                },
            });
            setMessage({ type: 'success', text: t('saveSuccess') });
            setConfiguringProvider(null);
            setApiKey('');
            setBaseUrl('');
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

                        return (
                            <div key={type.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <ModelSelector
                                        label={type.name}
                                        value={currentModelId}
                                        options={availableModels.map(m => ({
                                            provider: m.provider,
                                            model: m.id
                                        }))}
                                        onChange={(val) => {
                                            const [provider, model] = val.split(':');
                                            if (provider && model) {
                                                handleUpdateSetting(type.id, provider, model);
                                            }
                                        }}
                                        disabled={availableModels.length === 0}
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
                            isConnected={!!providers.find(Pp => Pp.provider === p.id)}
                            onConfigure={() => {
                                setConfiguringProvider(p.id);
                                // In a real app, we might load existing config here, but usually API keys are write-only for security
                                setApiKey('');
                                setBaseUrl('');
                            }}
                            onDelete={
                                providers.find(Pp => Pp.provider === p.id)
                                    ? () => initiateDeleteProvider(p.id)
                                    : undefined
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Configuration Modal */}
            {configuringProvider && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">
                                {t('configure')} {supportedProviders.find(p => p.id === configuringProvider)?.name}
                            </h3>
                            <button
                                onClick={() => setConfiguringProvider(null)}
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
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
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

                            {configuringProvider === 'openai' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('baseUrl')} ({t('optional')})</label>
                                    <input
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}

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
                                    onClick={() => setConfiguringProvider(null)}
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
                confirmText={t('Common.delete')}
                cancelText={t('Common.cancel')}
                isDangerous
                isLoading={deleteLoading}
            />
        </div>
    );
}
