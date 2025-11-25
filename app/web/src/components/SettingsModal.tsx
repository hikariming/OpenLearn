'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, User, Lock, Users, Brain } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import ModelProviderSettings from './settings/ModelProviderSettings';
import TenantMembersSettings from './settings/TenantMembersSettings';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * 个人设置弹窗组件
 * 左右分栏布局:左侧导航,右侧内容
 */
export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const t = useTranslations('Settings');
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'info' | 'password' | 'members' | 'modelProvider'>('info');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 个人信息表单
    const [name, setName] = useState(user?.name || '');

    // 修改密码表单
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (!isOpen) return null;

    const menuItems = [
        { id: 'info', label: t('personalInfo'), icon: User },
        { id: 'password', label: t('changePassword'), icon: Lock },
        { id: 'members', label: t('members'), icon: Users },
        { id: 'modelProvider', label: t('modelProvider'), icon: Brain },
    ] as const;

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await api.patch('/auth/profile', { name });
            // 更新本地用户信息
            const updatedUser = { ...user!, name: response.data.name };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            setMessage({ type: 'success', text: t('updateSuccess') });

            // 刷新页面以更新所有显示的用户名
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('updateError') });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // 验证密码
        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: t('passwordTooShort') });
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t('passwordMismatch') });
            setLoading(false);
            return;
        }

        try {
            await api.post('/auth/change-password', {
                oldPassword: currentPassword,
                newPassword,
            });

            setMessage({ type: 'success', text: t('updateSuccess') });

            // 清空表单
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // 2秒后注销,要求用户使用新密码重新登录
            setTimeout(() => {
                logout();
            }, 2000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || t('updateError') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] max-h-[800px] flex overflow-hidden border border-gray-100">
                {/* 左侧导航 */}
                <div className="w-64 bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-8 pl-2">
                        <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                    </div>

                    <nav className="space-y-1 flex-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                                        isActive
                                            ? 'bg-white text-blue-600 font-semibold shadow-sm ring-1 ring-gray-100'
                                            : 'text-gray-500 hover:bg-white/60 hover:text-gray-900'
                                    }`}
                                >
                                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                    
                    {/* Close button at bottom of sidebar for mobile/easy access or keep in header? 
                        Actually let's keep the X in the top right of the modal content or overlay, 
                        but here sticking to the design request "sidebar + content".
                    */}
                </div>

                {/* 右侧内容 */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] relative">
                    {/* Content Header with Close Button */}
                     <div className="absolute top-6 right-6 z-10">
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        {message && (
                            <div
                                className={`mb-6 p-4 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${
                                    message.type === 'success'
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-red-50 text-red-700 border border-red-100'
                                }`}
                            >
                                {message.text}
                            </div>
                        )}

                    {activeTab === 'info' && (
                        <div className="max-w-3xl">
                             <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{t('personalInfo')}</h3>
                                <p className="text-gray-500 mt-1">Update your personal details and profile settings.</p>
                            </div>
                            
                            <div className="bg-white rounded-2xl p-8 border border-gray-200/60 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('name')}
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/30 focus:bg-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('email')}
                                        </label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="mt-2 text-xs text-gray-500">Email address cannot be changed</p>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {loading ? 'Saving...' : t('save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="max-w-3xl">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{t('changePassword')}</h3>
                                <p className="text-gray-500 mt-1">Ensure your account is secure by using a strong password.</p>
                            </div>

                            <div className="bg-white rounded-2xl p-8 border border-gray-200/60 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]">
                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('currentPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/30 focus:bg-white"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('newPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/30 focus:bg-white"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            {t('confirmPassword')}
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50/30 focus:bg-white"
                                            required
                                            minLength={6}
                                        />
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            {loading ? 'Saving...' : t('save')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'members' && (
                        <div>
                            <TenantMembersSettings />
                        </div>
                    )}

                    {activeTab === 'modelProvider' && (
                        <div>
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{t('modelProvider')}</h3>
                                <p className="text-gray-500 mt-1">Manage AI model providers and default model settings.</p>
                            </div>
                            <ModelProviderSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
