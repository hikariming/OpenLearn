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
            console.log('[AuthContext] Initializing auth...');

            // 1. Try to restore user from localStorage first (Optimistic UI)
            const savedUser = localStorage.getItem('user');
            console.log('[AuthContext] savedUser from localStorage:', savedUser);

            if (savedUser) {
                try {
                    const parsedUser = JSON.parse(savedUser);
                    setUser(parsedUser);
                    console.log('[AuthContext] Restored user from localStorage:', parsedUser);
                } catch (e) {
                    console.error('[AuthContext] Failed to parse user from localStorage', e);
                    localStorage.removeItem('user');
                }
            }

            // 2. Check for token and validate with backend
            const savedToken = Cookies.get('token');
            console.log('[AuthContext] savedToken from cookies:', savedToken);

            if (savedToken) {
                setToken(savedToken); // Set token immediately so API calls work
                try {
                    console.log('[AuthContext] Verifying token with /auth/me...');
                    // 调用后端API验证token并获取最新用户信息
                    const { data } = await api.get('/auth/me');
                    console.log('[AuthContext] /auth/me success:', data);
                    setUser(data);
                    // Update localStorage with fresh data
                    localStorage.setItem('user', JSON.stringify(data));
                } catch (error: any) {
                    console.error('[AuthContext] Auth verification failed:', error);

                    // Only clear state if it's explicitly an auth error (401)
                    // Network errors or 500s shouldn't log the user out if we have a token
                    if (error.response?.status === 401) {
                        console.log('[AuthContext] 401 received, clearing state');
                        Cookies.remove('token');
                        localStorage.removeItem('user');
                        setUser(null);
                        setToken(null);
                    } else {
                        console.warn('[AuthContext] Non-401 error during verification, keeping local state if available');
                    }
                }
            } else {
                console.log('[AuthContext] No token found, clearing state');
                // No token, ensure no user state
                setUser(null);
                localStorage.removeItem('user');
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const login = (newToken: string, userData: User) => {
        console.log('[AuthContext] Login called', { newToken, userData });
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
