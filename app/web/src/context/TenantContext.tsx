'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

/**
 * 租户（空间）接口定义
 */
export interface Tenant {
    id: string;
    name: string;
    role: string;
    plan: string;
    status: string;
    current: boolean;
    memberCount?: number;
    createdAt: string;
}

/**
 * 租户上下文接口
 */
interface TenantContextType {
    currentTenant: Tenant | null;
    tenants: Tenant[];
    loading: boolean;
    switchTenant: (tenantId: string) => Promise<void>;
    refreshTenants: () => Promise<void>;
    createTenant: (name: string) => Promise<Tenant>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * 租户上下文 Provider
 * 管理用户的所有租户和当前激活的租户
 */
export function TenantProvider({ children }: { children: ReactNode }) {
    const { user, token } = useAuth();
    const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);

    /**
     * 刷新租户列表
     */
    const refreshTenants = async () => {
        if (!token) {
            setTenants([]);
            setCurrentTenant(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:3001/tenants', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch tenants');
            }

            const data = await response.json();
            setTenants(data);

            // 找到当前激活的租户
            const current = data.find((t: Tenant) => t.current);
            setCurrentTenant(current || null);
        } catch (error) {
            console.error('Failed to fetch tenants:', error);
            setTenants([]);
            setCurrentTenant(null);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 切换当前租户
     */
    const switchTenant = async (tenantId: string) => {
        if (!token) return;

        try {
            const response = await fetch(`http://localhost:3001/tenants/${tenantId}/switch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to switch tenant');
            }

            // 刷新租户列表
            await refreshTenants();
        } catch (error) {
            console.error('Failed to switch tenant:', error);
            throw error;
        }
    };

    /**
     * 创建新租户
     */
    const createTenant = async (name: string): Promise<Tenant> => {
        if (!token) {
            throw new Error('Not authenticated');
        }

        try {
            const response = await fetch('http://localhost:3001/tenants', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name }),
            });

            if (!response.ok) {
                throw new Error('Failed to create tenant');
            }

            const newTenant = await response.json();

            // 刷新租户列表
            await refreshTenants();

            return newTenant;
        } catch (error) {
            console.error('Failed to create tenant:', error);
            throw error;
        }
    };

    // 当用户登录/登出时刷新租户列表
    useEffect(() => {
        refreshTenants();
    }, [user, token]);

    return (
        <TenantContext.Provider
            value={{
                currentTenant,
                tenants,
                loading,
                switchTenant,
                refreshTenants,
                createTenant,
            }}
        >
            {children}
        </TenantContext.Provider>
    );
}

/**
 * 使用租户上下文的 Hook
 */
export const useTenant = () => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within TenantProvider');
    }
    return context;
};
