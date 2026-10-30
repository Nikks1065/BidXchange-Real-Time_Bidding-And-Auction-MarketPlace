import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, tokenStorage } from '../services/api.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(tokenStorage.get());
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    tokenStorage.set(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (data) => {
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

  const switchDemoAccount = async (role) => {
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
