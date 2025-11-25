import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ModelSelectorProps {
    label: string;
    value: string;
    options: { provider: string; model: string; label: string }[];
    onChange: (value: string) => void;
    disabled?: boolean;
}

export default function ModelSelector({ label, value, options, onChange, disabled }: ModelSelectorProps) {
    const t = useTranslations('ModelProvider');

    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="relative w-64">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 pr-8 disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-gray-100"
                >
                    <option value="">{t('selectModel')}</option>
                    {options.map((opt) => (
                        <option key={`${opt.provider}:${opt.model}`} value={`${opt.provider}:${opt.model}`}>
                            {opt.label} · {opt.provider}
                        </option>
                    ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-3 text-gray-500 pointer-events-none" size={16} />
            </div>
        </div>
    );
}
