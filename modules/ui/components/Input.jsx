/**
 * Input Component - Nexus Framework
 * Componente de input reutilizável com validação
 */

import React, { useState, forwardRef } from 'react';
import { isFunction } from '../../../utils/types.js';

const Input = forwardRef(({
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled = false,
  required = false,
  error = '',
  helperText = '',
  variant = 'default',
  size = 'medium',
  fullWidth = false,
  startIcon = null,
  endIcon = null,
  className = '',
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  // Classes base
  const baseClasses = 'border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variantes
  const variants = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    filled: 'border-gray-300 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    outlined: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  };

  // Estados de erro
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  // Tamanhos
  const sizes = {
    small: startIcon || endIcon ? 'px-8 py-1.5 text-sm' : 'px-3 py-1.5 text-sm',
    medium: startIcon || endIcon ? 'px-10 py-2 text-base' : 'px-4 py-2 text-base',
    large: startIcon || endIcon ? 'px-12 py-3 text-lg' : 'px-6 py-3 text-lg'
  };

  // Classes do input
  const inputClasses = [
    baseClasses,
    variants[variant] || variants.default,
    sizes[size] || sizes.medium,
    errorClasses,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  // Handler de focus
  const handleFocus = (e) => {
    setFocused(true);
    if (isFunction(onFocus)) {
      onFocus(e);
    }
  };

  // Handler de blur
  const handleBlur = (e) => {
    setFocused(false);
    if (isFunction(onBlur)) {
      onBlur(e);
    }
  };

  // Classes do container
  const containerClasses = [
    'relative',
    fullWidth ? 'w-full' : ''
  ].filter(Boolean).join(' ');

  // Classes do label
  const labelClasses = [
    'block text-sm font-medium mb-1',
    error ? 'text-red-700' : 'text-gray-700',
    disabled ? 'opacity-50' : ''
  ].filter(Boolean).join(' ');

  // Posição dos ícones
  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  const iconPositions = {
    start: {
      small: 'left-2',
      medium: 'left-3',
      large: 'left-4'
    },
    end: {
      small: 'right-2',
      medium: 'right-3',
      large: 'right-4'
    }
  };

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Container do Input */}
      <div className="relative">
        {/* Ícone inicial */}
        {startIcon && (
          <div className={`absolute inset-y-0 left-0 flex items-center ${iconPositions.start[size]} pointer-events-none`}>
            {React.cloneElement(startIcon, {
              className: `${iconSizes[size]} text-gray-400`
            })}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />

        {/* Ícone final */}
        {endIcon && (
          <div className={`absolute inset-y-0 right-0 flex items-center ${iconPositions.end[size]} pointer-events-none`}>
            {React.cloneElement(endIcon, {
              className: `${iconSizes[size]} text-gray-400`
            })}
          </div>
        )}
      </div>

      {/* Mensagem de erro ou helper text */}
      {(error || helperText) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Componentes especializados
export const PasswordInput = forwardRef((props, ref) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => setShowPassword(!showPassword);

  const EyeIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeOffIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
    </svg>
  );

  return (
    <Input
      {...props}
      ref={ref}
      type={showPassword ? 'text' : 'password'}
      endIcon={
        <button
          type="button"
          className="pointer-events-auto"
          onClick={togglePassword}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
});

PasswordInput.displayName = 'PasswordInput';

export const SearchInput = forwardRef((props, ref) => {
  const SearchIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  return (
    <Input
      {...props}
      ref={ref}
      type="search"
      placeholder="Buscar..."
      startIcon={<SearchIcon />}
    />
  );
});

SearchInput.displayName = 'SearchInput';

export const NumberInput = forwardRef((props, ref) => {
  return (
    <Input
      {...props}
      ref={ref}
      type="number"
    />
  );
});

NumberInput.displayName = 'NumberInput';

export const EmailInput = forwardRef((props, ref) => {
  const EmailIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );

  return (
    <Input
      {...props}
      ref={ref}
      type="email"
      startIcon={<EmailIcon />}
    />
  );
});

EmailInput.displayName = 'EmailInput';

export default Input;