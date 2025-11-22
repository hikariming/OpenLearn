'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
    MessageSquare,
    Copy,
    BookOpen,
    Mic,
    RefreshCw,
    Radio,
    FileText,
    Info,
    Activity,
    Globe,
    Plus,
    History as HistoryIcon,
    Paperclip
} from 'lucide-react';

export default function AIAssistant() {
    const t = useTranslations('AIAssistant');
    const [activeTab, setActiveTab] = useState('chat');

    const tabs = [
        { id: 'chat', icon: MessageSquare, label: t('tabs.chat'), color: 'bg-green-500' },
        { id: 'flashcards', icon: Copy, label: t('tabs.flashcards') },
        { id: 'quiz', icon: BookOpen, label: t('tabs.quiz') },
        { id: 'podcast', icon: Radio, label: t('tabs.podcast') },
        { id: 'summary', icon: FileText, label: t('tabs.summary') },
        { id: 'explanation', icon: Info, label: t('tabs.explanation') },
    ];

    // 5个动作按钮 - 3-2布局
    const actions = [
        { id: 'quizMe', icon: BookOpen, label: t('actions.quizMe') },
        { id: 'mindMap', icon: Activity, label: t('actions.mindMap') },
        { id: 'voiceMode', icon: Mic, label: t('actions.voiceMode') },
        { id: 'flashcards', icon: Copy, label: t('actions.flashcards') },
        { id: 'search', icon: Globe, label: t('actions.search') },
    ];

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 transition-all duration-300 ease-in-out font-sans w-[400px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {/* Left Actions - Plus and History */}
                    <div className="flex items-center gap-2 text-gray-400 shrink-0 mr-4">
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <Plus size={18} />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                            <HistoryIcon size={18} />
                        </button>
                    </div>

                    {/* Tabs */}
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={
                                activeTab === tab.id
                                    ? "flex items-center gap-1.5 whitespace-nowrap text-xs transition-colors font-medium px-2.5 py-1.5 rounded-full shrink-0 bg-gray-100 text-gray-900"
                                    : "flex items-center gap-1.5 whitespace-nowrap text-xs transition-colors font-medium px-2.5 py-1.5 rounded-full shrink-0 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                            }
                        >
                            {activeTab === tab.id ? (
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            ) : (
                                <tab.icon size={14} />
                            )}
                            <span>{tab.label}</span>
                        </button>
                    ))}

                    {/* Right side spacer - 移除展开按钮 */}
                    <div className="flex items-center gap-2 text-gray-400 shrink-0 ml-auto">
                        {/* 展开/收起功能已移除 */}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-16 h-16 mb-6 text-gray-200">
                        <MessageSquare size={64} strokeWidth={1} />
                    </div>
                    <p className="text-base font-medium text-gray-400 mb-8">{t('greeting')}</p>

                    {/* 3-2布局的按钮网格 */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-md px-4">
                        {actions.map((action) => (
                            <button
                                key={action.id}
                                className="flex items-center justify-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors group bg-white shadow-sm"
                            >
                                <div className="text-gray-400 group-hover:text-gray-600">
                                    <action.icon size={16} />
                                </div>
                                <span className="text-xs text-gray-500 whitespace-nowrap">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4">
                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-4">
                    <div className="mb-8 text-gray-400 text-sm font-medium">
                        {t('actions.learnAnything')}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 hover:bg-gray-50 rounded-md transition-colors">
                                <span>Auto</span>
                                <RefreshCw size={10} />
                            </button>
                            <button className="w-6 h-6 flex items-center justify-center border border-gray-200 rounded-full text-gray-400 hover:bg-gray-50 text-xs">@</button>
                            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-500 rounded-full text-xs font-medium">
                                <Globe size={10} />
                                <span>{t('actions.search')}</span>
                                <button className="ml-1 text-blue-300 hover:text-blue-500">×</button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="text-gray-400 hover:text-gray-600">
                                <Paperclip size={18} />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                                <Mic size={18} />
                            </button>
                            <button className="flex items-center gap-2 bg-gray-800 text-white rounded-full px-3 py-1.5 hover:bg-gray-700 transition-colors">
                                <div className="flex items-center gap-0.5 h-3">
                                    <div className="w-0.5 h-2 bg-white rounded-full animate-pulse"></div>
                                    <div className="w-0.5 h-3 bg-white rounded-full animate-pulse delay-75"></div>
                                    <div className="w-0.5 h-1.5 bg-white rounded-full animate-pulse delay-150"></div>
                                </div>
                                <span className="text-xs font-bold">{t('actions.voiceMode')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
