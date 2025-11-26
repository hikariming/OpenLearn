'use client';

import { useEffect, useState } from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';
import ChatInterface from '@/components/chat/ChatInterface';
import { useRouter } from '@/i18n/routing';
import api from '@/lib/api';

export default function ChatPage() {
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentTenant || !user) {
            setLoading(false);
            return;
        }

        // Create a new chat session
        const createSession = async () => {
            try {
                const response = await api.post('/chat/sessions', {
                    title: '新对话',
                    provider: 'openai',
                    model: 'gpt-3.5-turbo',
                });
                setSessionId(response.data.id);
            } catch (error) {
                console.error('Failed to create session:', error);
            } finally {
                setLoading(false);
            }
        };

        createSession();
    }, [currentTenant, user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    if (!currentTenant) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">请先选择工作空间</div>
            </div>
        );
    }

    if (!sessionId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">创建会话失败</div>
            </div>
        );
    }

    return <ChatInterface tenantId={currentTenant.id} sessionId={sessionId} />;
}
