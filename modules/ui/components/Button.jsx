/**
 * Button Component - Nexus Framework
 * Componente de botão reutilizável com múltiplas variantes
 */

import React from 'react';
import { isString } from '../../../utils/types.js';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  icon = null,
  iconPosition = 'left',
  ...props
}) => {
  // Classes base
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // Variantes de cor
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    error: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500',
    ghost: 'text-blue-600 bg-transparent hover:bg-blue-50 focus:ring-blue-500',
    link: 'text-blue-600 bg-transparent hover:text-blue-800 focus:ring-blue-500 underline'
  };

  // Tamanhos
  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  // Classes dinâmicas
  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.medium,
    fullWidth ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  // Spinner de loading
  const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  // Renderizar ícone
  const renderIcon = () => {
    if (!icon) return null;
    
    if (isString(icon)) {
      return <span className={iconPosition === 'right' ? 'ml-2' : 'mr-2'}>{icon}</span>;
    }
    
    return React.cloneElement(icon, {
      className: `h-4 w-4 ${iconPosition === 'right' ? 'ml-2' : 'mr-2'}`
    });
  };

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <Spinner />}
      {!loading && iconPosition === 'left' && renderIcon()}
      {children}
      {!loading && iconPosition === 'right' && renderIcon()}
    </button>
  );
};

// Variações específicas do Button
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;
export const SuccessButton = (props) => <Button variant="success" {...props} />;
export const WarningButton = (props) => <Button variant="warning" {...props} />;
export const ErrorButton = (props) => <Button variant="error" {...props} />;
export const OutlineButton = (props) => <Button variant="outline" {...props} />;
export const GhostButton = (props) => <Button variant="ghost" {...props} />;
export const LinkButton = (props) => <Button variant="link" {...props} />;

export default Button;