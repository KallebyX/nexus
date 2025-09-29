/**
 * Componente LoginForm - Nexus UI
 * Formulário de login reutilizável com validação
 */

import React, { useState } from 'react';
import Button from './Button.jsx';
import Input from './Input.jsx';
import Alert from './Alert.jsx';

const LoginForm = ({
  onSubmit,
  onSocialLogin,
  socialProviders = ['google', 'github'],
  showRememberMe = true,
  showForgotPassword = true,
  showRegisterLink = true,
  loading = false,
  error = null,
  className = '',
  theme = 'light',
  layout = 'default' // default, compact, card
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Limpar erro do campo ao digitar
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleSocialLogin = (provider) => {
    if (onSocialLogin) {
      onSocialLogin(provider);
    }
  };

  const socialIcons = {
    google: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
      </svg>
    ),
    facebook: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    )
  };

  const themeClasses = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-800 text-white'
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert type="error" message={error} />
      )}

      <div>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={validationErrors.email}
          placeholder="seu@email.com"
          required
        />
      </div>

      <div>
        <Input
          label="Senha"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={validationErrors.password}
          placeholder="Sua senha"
          required
        />
      </div>

      <div className="flex items-center justify-between">
        {showRememberMe && (
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
              Lembrar de mim
            </label>
          </div>
        )}

        {showForgotPassword && (
          <div className="text-sm">
            <a href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Esqueceu a senha?
            </a>
          </div>
        )}
      </div>

      <div>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </div>

      {socialProviders.length > 0 && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continue com</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {socialProviders.map((provider) => (
              <Button
                key={provider}
                type="button"
                variant="outline"
                onClick={() => handleSocialLogin(provider)}
                className="flex items-center justify-center gap-3"
              >
                {socialIcons[provider]}
                <span className="capitalize">Continuar com {provider}</span>
              </Button>
            ))}
          </div>
        </>
      )}

      {showRegisterLink && (
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Não tem uma conta?{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Cadastre-se
            </a>
          </span>
        </div>
      )}
    </form>
  );

  if (layout === 'card') {
    return (
      <div className={`max-w-md w-full mx-auto ${className}`}>
        <div className={`p-8 rounded-lg shadow-lg border ${themeClasses[theme]}`}>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Bem-vindo de volta</h2>
            <p className="text-gray-600 mt-2">Entre na sua conta</p>
          </div>
          {renderForm()}
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className={`max-w-sm w-full mx-auto ${className}`}>
        {renderForm()}
      </div>
    );
  }

  return (
    <div className={`max-w-md w-full mx-auto ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold">Entrar</h2>
        <p className="text-gray-600 mt-2">Entre na sua conta para continuar</p>
      </div>
      {renderForm()}
    </div>
  );
};

export default LoginForm;