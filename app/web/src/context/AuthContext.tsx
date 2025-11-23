'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    updateUser: (user: User) => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    // 从当前路径提取 locale (例如 /en/dashboard -> en)
    const getLocaleFromPath = () => {
        const match = pathname?.match(/^\/(en|zh|ja)/);
        return match ? match[1] : 'en'; // 默认使用 en
    };

    useEffect(() => {
        const initializeAuth = async () => {
            const savedToken = Cookies.get('token');
            if (savedToken) {
                try {
                    // 调用后端API验证token并获取用户信息
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                    setToken(savedToken);
                    // 同步更新localStorage
                    localStorage.setItem('user', JSON.stringify(data));
                } catch (error) {
                    console.error('Auth initialization failed', error);
                    Cookies.remove('token');
                    localStorage.removeItem('user');
                    setToken(null);
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (newToken: string, userData: User) => {
        Cookies.set('token', newToken, { expires: 7 }); // 7 days
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setToken(newToken);
        const locale = getLocaleFromPath();
        router.push(`/${locale}/dashboard`);
    };

    const logout = () => {
        Cookies.remove('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
        const locale = getLocaleFromPath();
        router.push(`/${locale}/login`);
    };

    const updateUser = (userData: User) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                updateUser,
                isAuthenticated: !!user,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
