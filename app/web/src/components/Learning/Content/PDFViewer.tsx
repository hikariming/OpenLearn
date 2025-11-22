'use client';

import { ZoomIn, ZoomOut, Download, Share2, Maximize2 } from 'lucide-react';

export default function PDFViewer() {
    return (
        <div className="flex flex-col h-full bg-white shadow-sm m-4 rounded-xl overflow-hidden border border-gray-200">
            {/* Toolbar */}
            <div className="h-12 border-b border-gray-100 flex items-center justify-between px-4 bg-white">
                <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1 text-sm">
                        <span>4</span>
                        <span className="text-gray-400">/</span>
                        <span>77</span>
                    </div>
                    <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                        <button className="p-1 hover:bg-gray-100 rounded"><ZoomOut size={18} /></button>
                        <span className="text-sm">100%</span>
                        <button className="p-1 hover:bg-gray-100 rounded"><ZoomIn size={18} /></button>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                    <button className="p-1 hover:bg-gray-100 rounded"><Download size={18} /></button>
                    <button className="p-1 hover:bg-gray-100 rounded"><Share2 size={18} /></button>
                    <button className="p-1 hover:bg-gray-100 rounded"><Maximize2 size={18} /></button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-8 flex justify-center">
                <div className="w-full max-w-3xl bg-white shadow-lg min-h-[1000px] p-16 text-center">
                    <h1 className="text-5xl font-serif text-gray-800 mb-4">Comparative Politics Today</h1>
                    <h2 className="text-3xl font-serif text-blue-400 mb-16">A WORLD VIEW</h2>

                    <div className="mb-12">
                        <h3 className="text-xl font-sans font-bold text-gray-600 mb-2">GLOBAL EDITION</h3>
                        <h4 className="text-lg font-sans text-orange-400 font-bold">ELEVENTH EDITION</h4>
                    </div>

                    <div className="space-y-6 font-serif text-gray-800">
                        <div>
                            <div className="font-bold text-xl">G. Bingham Powell, Jr.</div>
                            <div className="text-sm text-gray-500">University of Rochester</div>
                        </div>
                        <div>
                            <div className="font-bold text-xl">Russell J. Dalton</div>
                            <div className="text-sm text-gray-500">University of California, Irvine</div>
                        </div>
                        <div>
                            <div className="font-bold text-xl">Kaare W. Strøm</div>
                            <div className="text-sm text-gray-500">University of California, San Diego</div>
                        </div>
                    </div>

                    <div className="mt-32 bg-black text-white p-2 inline-block font-bold tracking-widest">
                        PEARSON
                    </div>
                </div>
            </div>
        </div>
    );
}
