import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.ts';
import { api, tokenStorage } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; name: string; role?: string }) => Promise<void>;
  logout: () => void;
  switchDemoAccount: (role: 'buyer' | 'seller' | 'admin') => Promise<void>;
  toggleSellerRole: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      if (tokenStorage.get()) {
        const { user } = await api.auth.getMe();
        setUser(user);
      }
    } catch {
      tokenStorage.clear();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    tokenStorage.set(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; name: string; role?: string }) => {
    const res = await api.auth.register(data);
    tokenStorage.set(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    tokenStorage.clear();
    setToken(null);
    setUser(null);
  };

  const switchDemoAccount = async (role: 'buyer' | 'seller' | 'admin') => {
    let email = 'alex@bidxchange.com';
    if (role === 'seller') email = 'sarah@bidxchange.com';
    if (role === 'admin') email = 'admin@bidxchange.com';

    await login(email, 'Password123!');
  };

  const toggleSellerRole = async () => {
    const res = await api.auth.toggleRole();
    setUser(res.user);
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        switchDemoAccount,
        toggleSellerRole,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
