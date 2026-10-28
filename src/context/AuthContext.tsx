import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('savoria_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session: if no token, automatically switch to admin for convenience
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem('savoria_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
        } catch {
          // Token invalid, auto-login as admin
          await autoLoginDefault();
        }
      } else {
        await autoLoginDefault();
      }
      setIsLoading(false);
    }

    async function autoLoginDefault() {
      try {
        const res = await api.quickSwitch('admin');
        localStorage.setItem('savoria_token', res.token);
        setToken(res.token);
        setUser(res.user);
      } catch (err) {
        console.error('Auto login default failed:', err);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      localStorage.setItem('savoria_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: UserRole) => {
    setIsLoading(true);
    try {
      const res = await api.quickSwitch(role);
      localStorage.setItem('savoria_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('savoria_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
