import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/document';
import { toast } from "sonner";
import { api } from '../services/api';
import { useLocale } from './LocaleContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { t } = useLocale();

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login(email, password);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error(t('auth.invalidCredentials'));
          return;
        }
        if (response.status === 400) {
          toast.error(t('auth.invalidRequest'));
          return;
        }
        toast.error(t('auth.loginFailed'));
        return;
      }

      const data = await response.json();
      if (!data.token) {
        toast.error(t('toast.invalidResponse'));
        return;
      }

      const userData = { email, token: data.token };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', data.token);
      toast.success(t('toast.welcome', { email }));
    } catch (error) {
      console.error('Login error:', error);
      toast.error(t('auth.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    toast.success(t('toast.loggedOut'));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
