import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '@/api/apiClient';
import { logAction } from '@/lib/errorHandler';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const verifyToken = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const userData = await api.getMe();
      setUser(userData);
      setIsAuthenticated(true);
      logAction('verify_token', { success: true });
    } catch (error) {
      console.error('Token weryfikacja nieudana:', error);
      localStorage.removeItem('token');
      setToken(null);
      setIsAuthenticated(false);
      setUser(null);
      logAction('verify_token', { success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verifyToken();
  }, [token]);

  const login = async (email, password) => {
    try {
      const result = await api.login(email, password);
      if (result.token) {
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setUser(result.user);
        setIsAuthenticated(true);
        logAction('login', { email, success: true });
        return { success: true };
      }
      logAction('login', { email, success: false });
      return { success: false, error: 'Błąd logowania' };
    } catch (error) {
      console.error('Login error:', error);
      logAction('login', { email, error: error.message });
      return { success: false, error: error.message || 'Błąd logowania' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const result = await api.register({ name, email, password });
      if (result.token) {
        localStorage.setItem('token', result.token);
        setToken(result.token);
        setUser(result.user);
        setIsAuthenticated(true);
        logAction('register', { email, success: true });
        return { success: true };
      }
      logAction('register', { email, success: false });
      return { success: false, error: 'Błąd rejestracji' };
    } catch (error) {
      console.error('Register error:', error);
      logAction('register', { email, error: error.message });
      return { success: false, error: error.message || 'Błąd rejestracji' };
    }
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    logAction('logout', {});
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };
  
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};