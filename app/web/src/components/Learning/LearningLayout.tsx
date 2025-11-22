'use client';

import { ReactNode } from 'react';

interface LearningLayoutProps {
    children: ReactNode;
    rightPanel?: ReactNode;
}

export default function LearningLayout({ children, rightPanel }: LearningLayoutProps) {
    return (
        <div className="flex h-full overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
                {children}
            </div>

            {/* Right Panel (AI Assistant) */}
            {rightPanel && (
                <div className="hidden lg:block h-full shrink-0">
                    {rightPanel}
                </div>
            )}
        </div>
    );
}
