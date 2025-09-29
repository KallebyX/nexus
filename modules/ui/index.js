/**
 * Nexus UI Module - Complete React Components Library
 * Enterprise-grade components for rapid development
 * 
 * @version 2.0.0
 * @module Nexus/UI
 */

// Basic Components
export { default as Button } from './components/Button.jsx';
export { default as Input } from './components/Input.jsx';
export { default as Alert } from './components/Alert.jsx';
export { default as Footer } from './components/Footer.jsx';
export { default as LoginForm } from './components/LoginForm.jsx';

// Enhanced Components
export { 
  Button as EnhancedButton,
  DataTable,
  Modal,
  FormBuilder,
  Chart
} from './enhanced-components.jsx';

// Hooks
export { default as useAuth } from './hooks/useAuth.js';
export { default as useCart } from './hooks/useCart.js';
export { default as useForm } from './hooks/useForm.js';
export { default as useApi } from './hooks/useApi.js';

// UI Configuration
export const UIConfig = {
  theme: {
    colors: {
      primary: '#3b82f6',
      secondary: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444'
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '3rem'
    },
    typography: {
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      }
    }
  },
  components: {
    button: {
      defaultVariant: 'primary',
      defaultSize: 'medium'
    },
    dataTable: {
      defaultPageSize: 10,
      defaultPagination: true
    },
    modal: {
      defaultSize: 'medium',
      closeOnEscape: true
    }
  }
};

// Component Factory
export class UIFactory {
  static createComponent(type, props) {
    const components = {
      button: EnhancedButton,
      dataTable: DataTable,
      modal: Modal,
      form: FormBuilder,
      chart: Chart
    };
    
    const Component = components[type];
    if (!Component) {
      throw new Error(`Unknown component type: ${type}`);
    }
    
    return Component;
  }
  
  static createForm(schema, options = {}) {
    return {
      component: FormBuilder,
      props: {
        schema,
        ...options
      }
    };
  }
  
  static createDataTable(columns, data, options = {}) {
    return {
      component: DataTable,
      props: {
        columns,
        data,
        ...UIConfig.components.dataTable,
        ...options
      }
    };
  }
}

// Theme Provider Context (React components in separate files)
export const createThemeProvider = (React) => {
  const { createContext, useContext } = React;
  const ThemeContext = createContext(UIConfig.theme);

  const ThemeProvider = ({ children, theme = {} }) => {
    const mergedTheme = { ...UIConfig.theme, ...theme };
    
    return React.createElement(
      ThemeContext.Provider,
      { value: mergedTheme },
      children
    );
  };

  const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
  };

  return { ThemeProvider, useTheme, ThemeContext };
};

import React, { useState, useEffect } from 'react';

// Hook personalizado para autenticação
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nexus_token');
    if (token) {
      // Decodificar token e buscar dados do usuário
      // Implementação específica dependeria do backend
      setUser({ id: '1', name: 'Usuário Teste' });
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('nexus_token', data.token);
        setUser(data.user);
        return { success: true };
      }
      
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setUser(null);
  };

  return { user, loading, login, logout };
};

// Componente Button
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  `.trim();

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Carregando...
        </div>
      ) : children}
    </button>
  );
};

// Componente Card
export const Card = ({ 
  children, 
  title, 
  footer,
  className = '',
  ...props 
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}
      {...props}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
      )}
      
      <div className="px-6 py-4">
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

// Componente Input
export const Input = ({ 
  label, 
  type = 'text', 
  error,
  helper,
  required = false,
  className = '',
  ...props 
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <input
        type={type}
        className={`
          block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        `}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helper && !error && (
        <p className="mt-1 text-sm text-gray-500">{helper}</p>
      )}
    </div>
  );
};

// Componente Modal
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md' 
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className={`
          inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all
          sm:my-8 sm:align-middle sm:w-full ${sizes[size]}
        `}>
          {/* Header */}
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente Dashboard Layout
export const DashboardLayout = ({ 
  children, 
  sidebar, 
  header,
  user 
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden mr-4 text-gray-600 hover:text-gray-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-xl font-semibold text-gray-900">
              Oryum Nexus Dashboard
            </h1>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Olá, {user.name}</span>
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex h-full">
        {/* Sidebar */}
        <aside className={`
          bg-white w-64 shadow-sm border-r border-gray-200 transform transition-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:inset-0
        `}>
          <div className="p-6">
            {sidebar}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Componente Loading
export const Loading = ({ size = 'md', text = 'Carregando...' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="flex items-center justify-center p-4">
      <svg 
        className={`animate-spin ${sizes[size]} text-blue-600`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      {text && <span className="ml-2 text-gray-600">{text}</span>}
    </div>
  );
};

// Configuração do tema padrão
export const NexusTheme = {
  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#0284c7'
  },
  fonts: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Monaco', 'Consolas', 'monospace']
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

export default {
  useAuth,
  Button,
  Card,
  Input,
  Modal,
  DashboardLayout,
  Loading,
  NexusTheme
};