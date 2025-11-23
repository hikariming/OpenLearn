import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';

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

    // Form state for adding provider
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [baseUrl, setBaseUrl] = useState(''); // For OpenAI compatible
    const [showApiKey, setShowApiKey] = useState(false);

    const supportedProviders = [
        { id: 'openai', name: 'OpenAI' },
        // Add more as implemented
    ];

    const modelTypes = [
        { id: 'llm', name: t('modelType.llm') },
        { id: 'embedding', name: t('modelType.embedding') },
        { id: 'rerank', name: t('modelType.rerank') },
        { id: 'tts', name: t('modelType.tts') },
        { id: 'speech', name: t('modelType.speech') },
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
        setSaving(true);
        setMessage(null);

        try {
            await api.post('/model-providers', {
                provider: selectedProvider,
                config: {
                    apiKey,
                    baseUrl: baseUrl || undefined,
                },
            });
            setMessage({ type: 'success', text: t('saveSuccess') });
            setShowAddForm(false);
            setApiKey('');
            setBaseUrl('');
            fetchData(); // Refresh data
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('saveError') });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProvider = async (providerId: string) => {
        if (!confirm(t('confirmDelete'))) return;

        try {
            await api.delete(`/model-providers/${providerId}`);
            setMessage({ type: 'success', text: t('deleteSuccess') });
            fetchData();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('deleteError') });
        }
    };

    const handleUpdateSetting = async (modelType: string, provider: string, model: string) => {
        try {
            await api.post('/model-providers/settings', {
                modelType,
                provider,
                model,
            });
            // Optimistic update
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
            fetchData(); // Revert on error
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

            {/* Provider Configuration */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{t('providers')}</h3>
                    {!showAddForm && (
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus size={16} />
                            {t('addProvider')}
                        </button>
                    )}
                </div>

                {showAddForm && (
                    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <form onSubmit={handleSaveProvider} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('providerType')}</label>
                                <select
                                    value={selectedProvider}
                                    onChange={(e) => setSelectedProvider(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {supportedProviders.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-10"
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
                            {selectedProvider === 'openai' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('baseUrl')} ({t('optional')})</label>
                                    <input
                                        type="text"
                                        value={baseUrl}
                                        onChange={(e) => setBaseUrl(e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {saving ? t('saving') : t('save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="space-y-3">
                    {providers.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">{t('noProviders')}</p>
                    ) : (
                        providers.map(p => (
                            <div key={p.provider} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${p.config ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className="font-medium text-gray-900 capitalize">{p.provider}</span>
                                </div>
                                <button
                                    onClick={() => handleDeleteProvider(p.provider)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                    title={t('delete')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Default Models */}
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{t('defaultModels')}</h3>
                <div className="space-y-4">
                    {modelTypes.map(type => {
                        const currentSetting = settings.find(s => s.modelType === type.id);
                        const currentModelId = currentSetting ? `${currentSetting.provider}:${currentSetting.model}` : '';

                        return (
                            <div key={type.id} className="grid grid-cols-3 gap-4 items-center">
                                <label className="text-sm font-medium text-gray-700">{type.name}</label>
                                <div className="col-span-2">
                                    <select
                                        value={currentModelId}
                                        onChange={(e) => {
                                            const [provider, model] = e.target.value.split(':');
                                            if (provider && model) {
                                                handleUpdateSetting(type.id, provider, model);
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        disabled={availableModels.length === 0}
                                    >
                                        <option value="">{t('selectModel')}</option>
                                        {availableModels.map(m => (
                                            <option key={`${m.provider}:${m.id}`} value={`${m.provider}:${m.id}`}>
                                                {m.provider} / {m.id}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
