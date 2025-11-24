import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDown, Check, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MemberRoleSelectorProps {
    currentRole: 'owner' | 'admin' | 'normal';
    canEdit: boolean;
    onRoleChange: (newRole: string) => void;
    onRemove: () => void;
}

/**
 * 成员角色选择器组件
 * 参考 dify 实现，使用下拉菜单显示角色选项和说明
 */
export default function MemberRoleSelector({
    currentRole,
    canEdit,
    onRoleChange,
    onRemove,
}: MemberRoleSelectorProps) {
    const t = useTranslations('TenantMembers');

    // 角色列表（不包括 owner）
    const availableRoles = ['admin', 'normal'] as const;

    const roleConfig = {
        owner: {
            label: t('roles.owner'),
            color: 'bg-purple-100 text-purple-700',
        },
        admin: {
            label: t('roles.admin'),
            tip: t('roles.adminTip'),
            color: 'bg-blue-100 text-blue-700',
        },
        normal: {
            label: t('roles.normal'),
            tip: t('roles.normalTip'),
            color: 'bg-gray-100 text-gray-700',
        },
    };

    // 如果不可编辑，只显示静态角色徽章
    if (!canEdit) {
        return (
            <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${roleConfig[currentRole].color}`}
            >
                {roleConfig[currentRole].label}
            </span>
        );
    }

    // 可编辑时显示下拉菜单
    return (
        <Menu as="div" className="relative">
            {({ open }: { open: boolean }) => (
                <>
                    <Menu.Button
                        className={`group flex items-center justify-between gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${open
                            ? 'bg-gray-50 border-gray-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                    >
                        <span className="text-gray-700">{roleConfig[currentRole].label}</span>
                        <ChevronDown
                            size={14}
                            className={`text-gray-500 transition-transform ${open ? 'rotate-180' : ''
                                }`}
                        />
                    </Menu.Button>

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 overflow-hidden">
                            {/* 角色选项 */}
                            <div className="p-1">
                                {availableRoles.map((role) => (
                                    <Menu.Item key={role}>
                                        {({ active }: { active: boolean }) => (
                                            <button
                                                onClick={() => onRoleChange(role)}
                                                className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${active ? 'bg-gray-50' : ''
                                                    }`}
                                            >
                                                <div className="mt-0.5 w-4 h-4 flex-shrink-0">
                                                    {role === currentRole && (
                                                        <Check size={16} className="text-blue-600" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {roleConfig[role].label}
                                                    </div>
                                                    {roleConfig[role].tip && (
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            {roleConfig[role].tip}
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        )}
                                    </Menu.Item>
                                ))}
                            </div>

                            {/* 分隔线 */}
                            <div className="border-t border-gray-100" />

                            {/* 移除成员选项 */}
                            <div className="p-1">
                                <Menu.Item>
                                    {({ active }: { active: boolean }) => (
                                        <button
                                            onClick={onRemove}
                                            className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors ${active ? 'bg-red-50' : ''
                                                }`}
                                        >
                                            <Trash2
                                                size={16}
                                                className="mt-0.5 text-red-600 flex-shrink-0"
                                            />
                                            <div className="flex-1">
                                                <div className="text-sm font-semibold text-red-600">
                                                    {t('removeFromTeam')}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {t('removeFromTeamTip')}
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                </Menu.Item>
                            </div>
                        </Menu.Items>
                    </Transition>
                </>
            )}
        </Menu>
    );
}
