import { useTranslations } from 'next-intl';
import { Upload, Link as LinkIcon, Mic, ArrowUp, Plus, Box, Clock } from 'lucide-react';

export default function Dashboard() {
  const t = useTranslations('Dashboard');

  return (
    <div className="max-w-5xl mx-auto pt-12 pb-20">
      {/* Greeting */}
      <h1 className="text-4xl font-medium text-center mb-12 text-gray-900">
        {t('greeting')}
      </h1>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
        <button className="flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all text-left group">
          <div className="mb-3 text-gray-500 group-hover:text-gray-700">
            <Upload size={24} />
          </div>
          <div className="font-medium text-lg mb-1">{t('upload')}</div>
          <div className="text-sm text-gray-400">{t('uploadDesc')}</div>
        </button>

        <button className="flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all text-left group">
          <div className="mb-3 text-gray-500 group-hover:text-gray-700">
            <LinkIcon size={24} />
          </div>
          <div className="font-medium text-lg mb-1">{t('paste')}</div>
          <div className="text-sm text-gray-400">{t('pasteDesc')}</div>
        </button>

        <button className="flex flex-col items-start p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all text-left group">
          <div className="mb-3 text-gray-500 group-hover:text-gray-700">
            <Mic size={24} />
          </div>
          <div className="font-medium text-lg mb-1">{t('record')}</div>
          <div className="text-sm text-gray-400">{t('recordDesc')}</div>
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-16 relative">
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="w-full h-14 pl-6 pr-14 rounded-full border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-0 shadow-sm text-lg placeholder:text-gray-400"
        />
        <button className="absolute right-2 top-2 w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors">
          <ArrowUp size={20} />
        </button>
      </div>

      {/* My Spaces */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-gray-800">{t('mySpaces')}</h2>
          <span className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer hover:text-gray-600">
            <Clock size={12} />
            Latest
            <ArrowUp size={10} className="rotate-180" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Space Card */}
          <button className="h-40 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:bg-gray-50 transition-all">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2 text-white">
              <Plus size={24} />
            </div>
            <span className="font-medium">{t('createSpace')}</span>
          </button>

          {/* Existing Space Card */}
          <div className="h-40 border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col">
            <div className="h-2/3 bg-gray-100 flex items-center justify-center">
              <Box size={32} className="text-gray-300" />
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center bg-white">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <Box size={16} />
                <span>嗷呜喵&apos;s Space</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">1 content</div>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Learning */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">{t('continueLearning')}</h2>
          <button className="text-sm font-bold text-gray-800 hover:underline">{t('viewAll')}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Content Card 1 */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer">
            <div className="aspect-[4/3] bg-gray-100 p-4">
              <div className="w-full h-full bg-white shadow-sm rounded border border-gray-100 p-2">
                <div className="w-full h-2 bg-gray-100 mb-2 rounded"></div>
                <div className="w-2/3 h-2 bg-gray-100 mb-4 rounded"></div>
                <div className="space-y-1">
                  <div className="w-full h-1 bg-gray-50 rounded"></div>
                  <div className="w-full h-1 bg-gray-50 rounded"></div>
                  <div className="w-full h-1 bg-gray-50 rounded"></div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">Eleventh Edition</div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1">Comparative Politics Today</h3>
              <p className="text-xs text-gray-500">G. Bingham Powell, Jr. • Russell J. Dalton • Kaare W. Strøm</p>
            </div>
          </div>

          {/* Content Card 2 */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer">
            <div className="aspect-[4/3] bg-gray-100 p-4 flex items-center justify-center">
              <div className="w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-black rounded-sm"></div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">Video</div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1">Let&apos;s build GPT: from scratch, in code, spelled out.</h3>
              <p className="text-xs text-gray-500">Andrej Karpathy</p>
            </div>
          </div>

          {/* Content Card 3 */}
          <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer">
            <div className="aspect-[4/3] bg-gray-100 p-4">
              <div className="w-full h-full bg-white shadow-sm rounded border border-gray-100 p-3 text-[6px] text-gray-400 overflow-hidden">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam...
              </div>
            </div>
            <div className="p-4">
              <div className="text-xs text-gray-400 uppercase font-bold mb-1">Paper</div>
              <h3 className="font-bold text-gray-900 leading-tight mb-1">VRAG-RL: Empower Vision-Language Models...</h3>
              <p className="text-xs text-gray-500">Research Paper</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
