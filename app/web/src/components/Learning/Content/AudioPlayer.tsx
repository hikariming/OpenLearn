'use client';

import { Pause, SkipBack, SkipForward, Mic, MoreHorizontal } from 'lucide-react';

export default function AudioPlayer() {
    return (
        <div className="flex flex-col h-full items-center justify-center bg-gray-50 p-8">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white">
                            <Mic size={20} />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Recording</h2>
                            <p className="text-sm text-gray-500">12:31:37 PM</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={24} />
                    </button>
                </div>

                {/* Waveform Visualization (Mock) */}
                <div className="h-32 flex items-center justify-center gap-1 mb-12 px-4">
                    {Array.from({ length: 60 }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-1.5 rounded-full bg-gray-200 ${i % 3 === 0 ? 'h-16' : i % 2 === 0 ? 'h-8' : 'h-4'} ${i > 20 && i < 40 ? 'bg-black' : ''}`}
                        ></div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-8">
                    <div className="text-4xl font-mono font-bold text-gray-900">00:12:45</div>

                    <div className="flex items-center gap-8">
                        <button className="p-4 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                            <SkipBack size={32} />
                        </button>
                        <button className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg">
                            <Pause size={32} fill="white" />
                        </button>
                        <button className="p-4 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                            <SkipForward size={32} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center">
                <p className="text-gray-400 text-sm mb-4">Start recording to see chapters</p>
            </div>
        </div>
    );
}
