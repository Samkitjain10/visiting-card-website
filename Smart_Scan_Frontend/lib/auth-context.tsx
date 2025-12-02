'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, setToken, removeToken } from './api-client';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      if (token) {
        // Ensure token is also in cookie for middleware
        if (typeof document !== 'undefined') {
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('auth_token='))
            ?.split('=')[1];
          if (!cookieToken || cookieToken !== token) {
            // Set cookie if missing or different
            const expires = new Date();
            expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
            document.cookie = `auth_token=${token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
          }
        }
        try {
          const data = await apiClient.get('/api/user');
          setUser(data.user);
        } catch (error) {
          // Token invalid, remove it
          removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient.post('/api/auth/login', { email, password });
    setToken(data.token);
    // Also set token in cookie for middleware
    if (typeof document !== 'undefined') {
      // Set cookie with proper attributes for cross-page navigation
      const expires = new Date();
      expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
      document.cookie = `auth_token=${data.token}; path=/; expires=${expires.toUTCString()}; SameSite=Lax; Secure=${window.location.protocol === 'https:'}`;
    }
    setUser(data.user);
    router.push('/');
  };

  const register = async (email: string, password: string, name?: string) => {
    await apiClient.post('/api/auth/register', { email, password, name });
    // After registration, automatically log in
    await login(email, password);
  };

  const logout = () => {
    removeToken();
    // Remove token from cookie
    if (typeof document !== 'undefined') {
      document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax';
    }
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const data = await apiClient.get('/api/user');
      setUser(data.user);
    } catch (error) {
      removeToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

