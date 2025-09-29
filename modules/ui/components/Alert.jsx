/**
 * Alert Component - Nexus Framework
 * Componente de alerta reutilizável para notificações
 */

import React, { useState } from 'react';
import { isFunction } from '../../../utils/types.js';

const Alert = ({
  type = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon = null,
  className = '',
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Se o alerta foi dispensado
  if (!isVisible) return null;

  // Classes base
  const baseClasses = 'p-4 rounded-lg border flex items-start space-x-3';

  // Tipos de alerta
  const types = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  // Ícones padrão
  const defaultIcons = {
    success: (
      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  };

  // Classes do alerta
  const alertClasses = [
    baseClasses,
    types[type] || types.info,
    className
  ].filter(Boolean).join(' ');

  // Handler de dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    if (isFunction(onDismiss)) {
      onDismiss();
    }
  };

  // Ícone a ser exibido
  const displayIcon = icon || defaultIcons[type];

  return (
    <div className={alertClasses} role="alert" {...props}>
      {/* Ícone */}
      {displayIcon && (
        <div className="flex-shrink-0">
          {displayIcon}
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-medium mb-1">
            {title}
          </h3>
        )}
        <div className="text-sm">
          {children}
        </div>
      </div>

      {/* Botão de fechar */}
      {dismissible && (
        <div className="flex-shrink-0">
          <button
            type="button"
            className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              type === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' :
              type === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-600' :
              type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600' :
              'text-blue-500 hover:bg-blue-100 focus:ring-blue-600'
            }`}
            onClick={handleDismiss}
          >
            <span className="sr-only">Fechar</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// Componentes especializados
export const SuccessAlert = (props) => <Alert type="success" {...props} />;
export const ErrorAlert = (props) => <Alert type="error" {...props} />;
export const WarningAlert = (props) => <Alert type="warning" {...props} />;
export const InfoAlert = (props) => <Alert type="info" {...props} />;

// Alert com ações
export const ActionAlert = ({
  primaryAction,
  secondaryAction,
  ...props
}) => {
  return (
    <Alert {...props}>
      <div className="mt-2 flex space-x-3">
        {primaryAction && (
          <button
            type="button"
            className={`text-sm font-medium underline hover:no-underline ${
              props.type === 'success' ? 'text-green-600' :
              props.type === 'error' ? 'text-red-600' :
              props.type === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`}
            onClick={primaryAction.onClick}
          >
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            type="button"
            className={`text-sm font-medium underline hover:no-underline ${
              props.type === 'success' ? 'text-green-600' :
              props.type === 'error' ? 'text-red-600' :
              props.type === 'warning' ? 'text-yellow-600' :
              'text-blue-600'
            }`}
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </Alert>
  );
};

// Alert inline (menor)
export const InlineAlert = ({ ...props }) => {
  return (
    <Alert
      {...props}
      className={`p-2 text-xs ${props.className || ''}`}
    />
  );
};

export default Alert;