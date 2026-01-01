'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check for existing auth on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await authApi.getMe();
                setUser(response.data.user);
                setIsAuthenticated(true);
            } catch (error) {
                // Token invalid or expired
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await authApi.login({ email, password });
        const { user, token } = response.data;

        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);

        return user;
    }, []);

    const signup = useCallback(async (name, email, password) => {
        const response = await authApi.register({ name, email, password });
        const { user, token } = response.data;

        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);

        return user;
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch (error) {
            // Ignore logout errors
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
