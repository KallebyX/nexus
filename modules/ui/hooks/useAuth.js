/**
 * Nexus useAuth Hook - Advanced Authentication Management
 * Complete authentication system with React context
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Context de autenticação
export const AuthContext = createContext(null);

// Provider de autenticação
export const AuthProvider = ({ children, authModule }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Verificar se usuário está logado ao inicializar
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const currentUser = await authModule.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authModule.login(credentials);
      
      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authModule.register(userData);
      
      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authModule.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const socialLogin = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authModule.socialLogin(provider);
      
      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authModule.updateProfile(userData);
      
      if (result.success) {
        setUser(result.user);
        return result;
      } else {
        setError(result.error);
        return result;
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (passwordData) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await authModule.changePassword(passwordData);
      
      if (!result.success) {
        setError(result.error);
      }
      
      return result;
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    hasRole: (role) => user?.roles?.includes(role) || user?.role === role,
    hasPermission: (permission) => user?.permissions?.includes(permission),
    login,
    register,
    logout,
    socialLogin,
    updateProfile,
    changePassword,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook principal
const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
};

export default useAuth;