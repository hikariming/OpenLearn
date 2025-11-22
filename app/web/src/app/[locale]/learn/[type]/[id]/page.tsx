'use client';

import { use } from 'react';
import LearningLayout from '@/components/Learning/LearningLayout';
import AIAssistant from '@/components/Learning/AIAssistant';
import PDFViewer from '@/components/Learning/Content/PDFViewer';
import VideoPlayer from '@/components/Learning/Content/VideoPlayer';
import AudioPlayer from '@/components/Learning/Content/AudioPlayer';
import { MessageSquare } from 'lucide-react';

export default function LearningPage({ params }: { params: Promise<{ type: string; id: string }> }) {
    const { type } = use(params);

    const renderContent = () => {
        switch (type) {
            case 'pdf':
                return <PDFViewer />;
            case 'video':
                return <VideoPlayer />;
            case 'audio':
                return <AudioPlayer />;
            case 'chat':
                return (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-16 h-16 mb-4 text-gray-200">
                            <MessageSquare size={64} strokeWidth={1} />
                        </div>
                        <p>Select a conversation to start</p>
                    </div>
                );
            default:
                return <div>Content not found</div>;
        }
    };

    return (
        <LearningLayout rightPanel={<AIAssistant />}>
            {renderContent()}
        </LearningLayout>
    );
}
