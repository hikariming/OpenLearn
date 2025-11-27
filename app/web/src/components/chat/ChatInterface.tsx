'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { Send, Square } from 'lucide-react';
import ModelSelector from './ModelSelector';
import MessageList from './MessageList';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ChatInterfaceProps {
    tenantId: string;
    sessionId?: string;
}

export default function ChatInterface({ tenantId, sessionId }: ChatInterfaceProps) {
    const [selectedModel, setSelectedModel] = useState({ provider: 'openai', model: 'gpt-3.5-turbo' });

    const { messages, input, handleInputChange, handleSubmit, isLoading, stop } = useChat({
        api: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/chat/completions`,
        body: {
            sessionId,
            provider: selectedModel.provider,
            model: selectedModel.model,
        },
        onError: (error: Error) => {
            console.error('Chat error:', error);
        },
    });

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim()) return;
        handleSubmit(e);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">AI 对话</h2>
                <ModelSelector
                    tenantId={tenantId}
                    value={selectedModel}
                    onChange={(provider, model) => setSelectedModel({ provider, model })}
                />
            </div>

            {/* Messages */}
            <MessageList messages={messages} />

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
                <form onSubmit={onSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="输入消息..."
                        disabled={isLoading}
                        className="flex-1"
                    />
                    {isLoading ? (
                        <Button type="button" onClick={stop} variant="outline">
                            <Square size={20} />
                        </Button>
                    ) : (
                        <Button type="submit" disabled={!input.trim()}>
                            <Send size={20} />
                        </Button>
                    )}
                </form>
            </div>
        </div>
    );
}
