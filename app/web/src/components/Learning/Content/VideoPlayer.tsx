'use client';

import { Play, SkipBack, SkipForward, Volume2, Settings, Maximize, Captions } from 'lucide-react';

export default function VideoPlayer() {
    return (
        <div className="flex flex-col h-full p-6 overflow-y-auto">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden relative group mb-6 shadow-lg">
                {/* Thumbnail / Video Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                    <div className="text-center text-white">
                        <h2 className="text-4xl font-bold mb-2 uppercase tracking-tighter">Let&apos;s Build GPT</h2>
                        <h2 className="text-4xl font-bold mb-2 uppercase tracking-tighter">From Scratch.</h2>
                        <h2 className="text-4xl font-bold mb-8 uppercase tracking-tighter">In Code.</h2>
                        <div className="w-16 h-16 bg-red-600 rounded-xl flex items-center justify-center mx-auto cursor-pointer hover:scale-105 transition-transform">
                            <Play size={32} fill="white" />
                        </div>
                    </div>
                </div>

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer">
                        <div className="w-1/3 h-full bg-red-600 rounded-full relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button><Play size={20} fill="white" /></button>
                            <button><SkipBack size={20} /></button>
                            <button><SkipForward size={20} /></button>
                            <div className="flex items-center gap-2 group/vol">
                                <button><Volume2 size={20} /></button>
                                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all">
                                    <div className="w-16 h-1 bg-white rounded-full ml-2"></div>
                                </div>
                            </div>
                            <span className="text-sm font-medium">12:45 / 1:54:32</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button><Captions size={20} /></button>
                            <button><Settings size={20} /></button>
                            <button><Maximize size={20} /></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transcript / Description */}
            <div className="max-w-4xl">
                <div className="flex items-center gap-4 mb-6">
                    <button className="px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Chapters
                    </button>
                    <button className="px-4 py-2 hover:bg-gray-100 text-gray-600 rounded-full text-sm font-medium flex items-center gap-2">
                        Transcript
                    </button>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">ChatGPT Introduction</h1>
                <p className="text-gray-600 leading-relaxed mb-8">
                    ChatGPT has rapidly gained popularity, enabling users to interact with AI for text-based tasks. It demonstrates probabilistic response generation, providing different answers to the same prompt, highlighting its dynamic capabilities. Many humorous prompts have emerged, showcasing the creativity and diversity of interactions with ChatGPT.
                </p>

                <h2 className="text-xl font-bold text-gray-900 mb-4">Understanding Language Models</h2>
                <p className="text-gray-600 leading-relaxed">
                    We are going to build a GPT from scratch. This is a deep dive into the architecture of the Transformer model, specifically the decoder-only architecture used by GPT. We will implement the self-attention mechanism, multi-head attention, feed-forward networks, and layer normalization.
                </p>
            </div>
        </div>
    );
}
