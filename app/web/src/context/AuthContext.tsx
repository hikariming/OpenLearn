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
    login: (token: string, user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
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
            const token = Cookies.get('token');
            if (token) {
                try {
                    // Validate token and get user profile
                    // Note: We need an endpoint for this. For now, we'll assume if token exists, we are logged in.
                    // Ideally: const { data } = await api.get('/auth/me'); setUser(data);
                    // For this MVP, we might persist user in localStorage or just rely on token presence for "isAuthenticated"
                    // and fetch user data on demand.
                    // Let's try to decode token or fetch profile if we had the endpoint.
                    // Since we don't have /auth/me yet, we will rely on localStorage for user info persistence for now.
                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }
                } catch (error) {
                    console.error('Auth initialization failed', error);
                    Cookies.remove('token');
                    localStorage.removeItem('user');
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (token: string, userData: User) => {
        Cookies.set('token', token, { expires: 7 }); // 7 days
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        const locale = getLocaleFromPath();
        router.push(`/${locale}/dashboard`);
    };

    const logout = () => {
        Cookies.remove('token');
        localStorage.removeItem('user');
        setUser(null);
        const locale = getLocaleFromPath();
        router.push(`/${locale}/login`);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
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
