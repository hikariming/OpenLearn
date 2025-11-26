'use client';

import { useState, useEffect } from 'react';
import { Listbox } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';
import api from '@/lib/api';

interface Model {
    id: string;
    name: string;
    provider: string;
    type: string;
}

interface ModelSelectorProps {
    tenantId: string;
    value: { provider: string; model: string };
    onChange: (provider: string, model: string) => void;
}

export default function ModelSelector({ tenantId, value, onChange }: ModelSelectorProps) {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await api.get(`/tenants/${tenantId}/models`);
                // Filter to only LLM models
                const llmModels = response.data.filter((m: Model) => m.type === 'llm');
                setModels(llmModels);
            } catch (error) {
                console.error('Failed to fetch models:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchModels();
    }, [tenantId]);

    const selectedModel = models.find(m => m.provider === value.provider && m.id === value.model);

    if (loading) {
        return (
            <div className="w-64 h-10 bg-gray-100 rounded-lg animate-pulse"></div>
        );
    }

    return (
        <Listbox value={value} onChange={(val) => onChange(val.provider, val.model)}>
            <div className="relative">
                <Listbox.Button className="relative w-64 cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <span className="block truncate">
                        {selectedModel ? selectedModel.name : '选择模型'}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </span>
                </Listbox.Button>

                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {models.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-500">未配置模型</div>
                    ) : (
                        models.map((model) => (
                            <Listbox.Option
                                key={`${model.provider}-${model.id}`}
                                value={{ provider: model.provider, model: model.id }}
                                className={({ active }) =>
                                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                                    }`
                                }
                            >
                                {({ selected }) => (
                                    <>
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                            {model.name}
                                        </span>
                                        <span className="block text-xs text-gray-500 truncate">{model.provider}</span>
                                        {selected && (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                                <Check className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        )}
                                    </>
                                )}
                            </Listbox.Option>
                        ))
                    )}
                </Listbox.Options>
            </div>
        </Listbox>
    );
}
