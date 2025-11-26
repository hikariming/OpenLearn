'use client';

import { useEffect, useRef } from 'react';
import type { Message as UIMessage } from 'ai';
import ReactMarkdown from 'react-markdown';

interface MessageListProps {
    messages: UIMessage[];
}

export default function MessageList({ messages }: MessageListProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
                <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                            }`}
                    >
                        {message.role === 'assistant' ? (
                            <ReactMarkdown className="prose prose-sm max-w-none prose-p:my-1 prose-pre:my-1 prose-headings:my-2">
                                {message.content}
                            </ReactMarkdown>
                        ) : (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                    </div>
                </div>
            ))}
            <div ref={bottomRef} />
        </div>
    );
}
