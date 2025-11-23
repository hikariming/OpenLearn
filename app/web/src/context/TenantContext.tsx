'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

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
    switching: boolean;
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
    const [switching, setSwitching] = useState(false);

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
            const { data } = await api.get('/tenants');
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

        setSwitching(true);
        try {
            await api.post(`/tenants/${tenantId}/switch`);
            // 刷新租户列表
            await refreshTenants();
        } catch (error) {
            console.error('Failed to switch tenant:', error);
            throw error;
        } finally {
            setSwitching(false);
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
            const { data } = await api.post('/tenants', { name });
            // 刷新租户列表
            await refreshTenants();
            return data;
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
                switching,
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
