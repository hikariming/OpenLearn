import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { UserPlus, Shield, Check } from 'lucide-react';
import api from '@/lib/api';
import { useTenant } from '@/context/TenantContext';
import { useAuth } from '@/context/AuthContext';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import MemberRoleSelector from './MemberRoleSelector';

interface Member {
    id: string;
    userId: string;
    role: 'owner' | 'admin' | 'normal';
    user: {
        name: string;
        email: string;
    };
    createdAt: string;
}

export default function TenantMembersSettings() {
    const t = useTranslations('TenantMembers');
    const { currentTenant } = useTenant();
    const { user } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true); // eslint-disable-line @typescript-eslint/no-unused-vars
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Invite Modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('normal');
    const [inviting, setInviting] = useState(false);

    // Confirm Dialog
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'remove';
        userId: string;
        userName: string;
    } | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const fetchMembers = useCallback(async () => {
        if (!currentTenant) return;
        setLoading(true);
        try {
            const { data } = await api.get(`/tenants/${currentTenant.id}/members`);
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    }, [currentTenant]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTenant) return;
        setInviting(true);
        try {
            await api.post(`/tenants/${currentTenant.id}/members`, {
                email: inviteEmail,
                role: inviteRole,
            });
            setMessage({ type: 'success', text: t('inviteSuccess') });
            setShowInviteModal(false);
            setInviteEmail('');
            fetchMembers();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('inviteError') });
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!currentTenant) return;
        setConfirmLoading(true);
        try {
            await api.delete(`/tenants/${currentTenant.id}/members/${userId}`);
            setMessage({ type: 'success', text: t('removeSuccess') });
            fetchMembers();
            setShowConfirmDialog(false);
            setConfirmAction(null);
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('removeError') });
        } finally {
            setConfirmLoading(false);
        }
    };

    const initiateRemoveMember = (userId: string, userName: string) => {
        setConfirmAction({ type: 'remove', userId, userName });
        setShowConfirmDialog(true);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!currentTenant) return;
        try {
            await api.patch(`/tenants/${currentTenant.id}/members/${userId}`, {
                role: newRole,
            });
            setMessage({ type: 'success', text: t('roleUpdateSuccess') });
            fetchMembers();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            setMessage({ type: 'error', text: error.response?.data?.message || t('roleUpdateError') });
        }
    };

    if (!currentTenant) return null;

    // Determine if current user can manage others (Owner or Admin)
    const currentUserMember = members.find(m => m.userId === user?.id);
    const canManage = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{t('title')}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('memberCount', { count: members.length })}
                    </p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                    <UserPlus size={16} />
                    {t('inviteMember')}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            {/* Member List */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-500">{t('user')}</th>
                            <th className="px-6 py-3 font-medium text-gray-500">{t('role')}</th>
                            <th className="px-6 py-3 font-medium text-gray-500">{t('joinedAt')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {members.map(member => {
                            const isCurrentUser = member.userId === user?.id;
                            const isOwner = member.role === 'owner';
                            // Can edit if: I have permission AND target is not owner AND target is not me (optional safety)
                            const canEditRole = canManage && !isOwner && !isCurrentUser;

                            return (
                                <tr key={member.id} className={`transition-colors ${isCurrentUser ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold uppercase text-xs">
                                                {member.user.name[0]}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                                    {member.user.name}
                                                    {isCurrentUser && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-gray-500 text-xs">{member.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <MemberRoleSelector
                                            currentRole={member.role}
                                            canEdit={canEditRole}
                                            onRoleChange={(newRole) => handleRoleChange(member.userId, newRole)}
                                            onRemove={() => initiateRemoveMember(member.userId, member.user.name)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {new Date(member.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform transition-all">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{t('inviteMember')}</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Invite a user by email. They will be added to the workspace immediately if they already have an account.
                        </p>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('role')}</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                                >
                                    <option value="normal">{t('roles.normal')}</option>
                                    <option value="admin">{t('roles.admin')}</option>
                                </select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {inviting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            {t('inviting')}
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            {t('sendInvite')}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={showConfirmDialog}
                onClose={() => {
                    setShowConfirmDialog(false);
                    setConfirmAction(null);
                }}
                onConfirm={() => {
                    if (confirmAction?.type === 'remove') {
                        handleRemoveMember(confirmAction.userId);
                    }
                }}
                title={t('confirmRemove')}
                description={confirmAction ? t('confirmRemoveDesc', { name: confirmAction.userName }) : ''}
                confirmText={t('Common.confirm')}
                cancelText={t('Common.cancel')}
                isDangerous
                isLoading={confirmLoading}
            />
        </div>
    );
}
