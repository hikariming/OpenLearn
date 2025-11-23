'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import {
    Plus,
    Search,
    Clock,
    Box,
    MessageSquare,
    Menu,
    ThumbsUp,
    BookOpen,
    ChevronDown,
    ChevronLeft,
    Settings,
    LogOut,
    Globe
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTenant } from '@/context/TenantContext';
import SettingsModal from './SettingsModal';
import CreateSpaceDialog from './CreateSpaceDialog';


export default function Sidebar() {
    const t = useTranslations('Sidebar');
    const tMenu = useTranslations('UserMenu');
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { currentTenant, tenants, loading, switchTenant } = useTenant();

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isSpaceMenuOpen, setIsSpaceMenuOpen] = useState(false);
    const [isCreateSpaceOpen, setIsCreateSpaceOpen] = useState(false);

    const changeLanguage = (locale: string) => {
        router.replace(pathname, { locale });
        setIsLangMenuOpen(false);
        setIsUserMenuOpen(false);
    };

    const handleLogout = () => {
        setIsUserMenuOpen(false);
        logout();
    };

    const handleOpenSettings = () => {
        setIsUserMenuOpen(false);
        setIsSettingsOpen(true);
    };

    const handleSwitchTenant = async (tenantId: string) => {
        try {
            await switchTenant(tenantId);
            setIsSpaceMenuOpen(false);
        } catch (error) {
            console.error('Failed to switch tenant:', error);
        }
    };


    return (
        <div className="w-64 h-screen shrink-0 border-r border-gray-100 flex flex-col bg-white">
            {/* Header */}
            <div className="p-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 font-bold text-xl">
                    <div className="w-6 h-6 bg-black rounded-sm"></div>
                    <span>OpenLearn</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <ChevronLeft size={20} />
                </button>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                <div className="px-4 mb-6">
                    <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors">
                        <Plus size={20} />
                        <span>{t('addContent')}</span>
                    </button>
                    <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors">
                        <Search size={20} />
                        <span>{t('search')}</span>
                    </button>
                    <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors">
                        <Clock size={20} />
                        <span>{t('history')}</span>
                    </button>
                </div>

                {/* Spaces */}
                <div className="px-4 mb-6">
                    <h3 className="text-xs font-bold text-gray-900 mb-2 px-2">{t('spaces')}</h3>

                    {/* 创建空间按钮 */}
                    <button
                        onClick={() => setIsCreateSpaceOpen(true)}
                        className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors"
                    >
                        <Plus size={20} />
                        <span>{t('createSpace')}</span>
                    </button>

                    {/* 当前空间（带下拉菜单） */}
                    {currentTenant && (
                        <div className="relative">
                            <button
                                onClick={() => setIsSpaceMenuOpen(!isSpaceMenuOpen)}
                                className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors"
                            >
                                <Box size={20} />
                                <span className="flex-1 text-left truncate">
                                    {currentTenant.name}
                                </span>
                                <ChevronDown size={16} className={`transition-transform ${isSpaceMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* 空间切换下拉菜单 */}
                            {isSpaceMenuOpen && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-lg rounded-lg mt-1 overflow-hidden z-10">
                                    <div className="p-1 max-h-64 overflow-y-auto">
                                        {tenants.map((tenant) => (
                                            <button
                                                key={tenant.id}
                                                onClick={() => handleSwitchTenant(tenant.id)}
                                                className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                                            >
                                                <Box size={16} />
                                                <span className="flex-1 truncate">{tenant.name}</span>
                                                {tenant.current && (
                                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 如果没有空间，显示提示 */}
                    {!loading && tenants.length === 0 && (
                        <div className="text-sm text-gray-500 px-2 py-2">
                            暂无空间，点击上方创建
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="px-4 mb-6">
                    <h3 className="text-xs font-bold text-gray-900 mb-2 px-2">{t('recentActivity')}</h3>
                    <div className="space-y-1">
                        <Link href="/learn/chat/1" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors text-sm truncate">
                            <MessageSquare size={16} />
                            <span className="truncate">Discussion on NIH1 Kin...</span>
                            <Box size={14} className="ml-auto text-gray-400" />
                        </Link>
                        <Link href="/learn/pdf/2" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors text-sm truncate">
                            <Menu size={16} />
                            <span className="truncate">Comparative Politics Toda...</span>
                        </Link>
                        <Link href="/learn/pdf/3" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors text-sm truncate">
                            <Menu size={16} />
                            <span className="truncate">VRAG-RL: Empower Vision...</span>
                        </Link>
                        <Link href="/learn/chat/4" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors text-sm truncate">
                            <MessageSquare size={16} />
                            <span className="truncate">Quick Sort Algorithm Expl...</span>
                        </Link>
                        <Link href="/learn/video/5" className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors text-sm truncate">
                            <span className="text-lg leading-none">▷</span>
                            <span className="truncate">Let&apos;s build GPT: from scrat...</span>
                        </Link>                    </div>
                </div>

                {/* Help & Tools */}
                <div className="px-4 mb-6">
                    <h3 className="text-xs font-bold text-gray-900 mb-2 px-2">{t('help')}</h3>
                    <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors">
                        <ThumbsUp size={20} />
                        <span>{t('feedback')}</span>
                    </button>
                    <button className="flex items-center gap-3 text-gray-600 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors">
                        <BookOpen size={20} />
                        <span>{t('guide')}</span>
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 shrink-0">
                <div className="bg-green-50 text-green-700 text-xs font-medium py-1 px-2 rounded mb-3 text-center">
                    Free 计划
                </div>

                {/* 用户菜单 */}
                <div className="relative">
                    <div
                        className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                        <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                        </div>
                        <div className="flex-1 font-medium text-sm">{user?.name || '用户'}</div>
                        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                    </div>

                    {/* 用户下拉菜单 */}
                    {isUserMenuOpen && (
                        <div className="absolute bottom-full left-0 w-full bg-white border border-gray-100 shadow-lg rounded-lg mb-2 overflow-hidden z-10">
                            <div className="p-1">
                                {/* 个人设置 */}
                                <button
                                    onClick={handleOpenSettings}
                                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                                >
                                    <Settings size={16} />
                                    <span>{tMenu('personalSettings')}</span>
                                </button>

                                {/* 语言切换 */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                        className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                                    >
                                        <Globe size={16} />
                                        <span className="flex-1">{tMenu('switchLanguage')}</span>
                                        <ChevronDown size={14} className={`transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* 语言子菜单 */}
                                    {isLangMenuOpen && (
                                        <div className="ml-6 mt-1 space-y-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); changeLanguage('zh'); }}
                                                className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                                            >
                                                {tMenu('chinese')}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); changeLanguage('en'); }}
                                                className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                                            >
                                                {tMenu('english')}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); changeLanguage('ja'); }}
                                                className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-sm rounded transition-colors"
                                            >
                                                {tMenu('japanese')}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 注销 */}
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-red-50 text-sm rounded transition-colors text-red-600"
                                >
                                    <LogOut size={16} />
                                    <span>{tMenu('logout')}</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 设置弹窗 */}
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

            {/* 创建空间对话框 */}
            <CreateSpaceDialog isOpen={isCreateSpaceOpen} onClose={() => setIsCreateSpaceOpen(false)} />
        </div>
    );
}
