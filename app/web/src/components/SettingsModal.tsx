'use client';

import { Fragment, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import ModelProviderSettings from './settings/ModelProviderSettings';

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
    const [activeTab, setActiveTab] = useState<'info' | 'password' | 'modelProvider'>('info');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // 个人信息表单
    const [name, setName] = useState(user?.name || '');

    // 修改密码表单
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
                {/* 左侧导航 */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-gray-900">{t('title')}</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'info'
                                ? 'bg-white text-gray-900 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                }`}
                        >
                            {t('personalInfo')}
                        </button>
                        <button
                            onClick={() => setActiveTab('password')}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'password'
                                ? 'bg-white text-gray-900 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                }`}
                        >
                            {t('changePassword')}
                        </button>
                        <button
                            onClick={() => setActiveTab('modelProvider')}
                            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'modelProvider'
                                ? 'bg-white text-gray-900 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                }`}
                        >
                            {t('modelProvider')}
                        </button>
                    </nav>
                </div>

                {/* 右侧内容 */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {message && (
                        <div
                            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('personalInfo')}</h3>
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('name')}
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">邮箱地址不可修改</p>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? '保存中...' : t('save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        {t('cancel')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('changePassword')}</h3>
                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('currentPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('newPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('confirmPassword')}
                                    </label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        {loading ? '保存中...' : t('save')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                    >
                                        {t('cancel')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'modelProvider' && (
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('modelProvider')}</h3>
                            <ModelProviderSettings />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
