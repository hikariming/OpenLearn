import { Settings2, Trash2 } from 'lucide-react';

interface ProviderCardProps {
    provider: {
        id: string;
        name: string;
    };
    isConnected: boolean;
    onConfigure: () => void;
    onDelete?: () => void;
}

export default function ProviderCard({ provider, isConnected, onConfigure, onDelete }: ProviderCardProps) {
    return (
        <div className="group flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-blue-200 transition-all duration-300">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm transition-colors ${isConnected ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                    {provider.name[0]}
                </div>
                <div>
                    <h4 className="font-semibold text-gray-900 text-base">{provider.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                        {isConnected ? (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] text-green-700 font-medium uppercase tracking-wide">Active</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-full border border-gray-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Not Configured</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onConfigure}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isConnected
                            ? 'text-gray-600 bg-gray-50 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-transparent hover:border-gray-200'
                            : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100'
                        }`}
                >
                    {isConnected ? (
                        <>
                            <Settings2 size={16} />
                            <span>Configure</span>
                        </>
                    ) : (
                        <span>Setup</span>
                    )}
                </button>
                {isConnected && onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                        title="Delete provider"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}
