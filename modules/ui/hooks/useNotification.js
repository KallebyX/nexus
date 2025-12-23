/**
 * useNotification Hook - Nexus Framework
 * Hook para gerenciamento de notificações do navegador (Web Notifications API)
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para notificações do navegador com suporte a:
 * - Solicitação de permissão
 * - Notificações com ações
 * - Notificações programadas
 * - Integração com Service Worker
 *
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Estado e ações de notificação
 */
const useNotification = (options = {}) => {
  const {
    onPermissionGranted,
    onPermissionDenied,
    onClick,
    onClose,
    onError,
    defaultIcon = '/icons/icon-192x192.png',
    defaultBadge = '/icons/badge-72x72.png',
    serviceWorkerPath = '/sw.js'
  } = options;

  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  // Verificar suporte e permissão atual
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    setPermission(Notification.permission);

    // Registrar Service Worker se disponível
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        setSwRegistration(registration);
      });
    }
  }, []);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.warn('Notificações não são suportadas neste navegador');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        onPermissionGranted?.();
      } else if (result === 'denied') {
        onPermissionDenied?.();
      }

      return result;
    } catch (error) {
      onError?.(error);
      return 'error';
    }
  }, [isSupported, onPermissionGranted, onPermissionDenied, onError]);

  // Verificar se pode notificar
  const canNotify = permission === 'granted' && isSupported;

  // Enviar notificação
  const notify = useCallback((title, notificationOptions = {}) => {
    if (!canNotify) {
      console.warn('Permissão de notificação não concedida');
      return null;
    }

    const options = {
      icon: defaultIcon,
      badge: defaultBadge,
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false,
      ...notificationOptions
    };

    try {
      // Usar Service Worker se disponível (para suporte a ações)
      if (swRegistration && options.actions) {
        swRegistration.showNotification(title, options);
        return null; // SW notification não retorna objeto
      }

      // Notificação direta
      const notification = new Notification(title, options);

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        onClick?.(event, notificationOptions.data);
      };

      notification.onclose = () => {
        onClose?.(notificationOptions.data);
      };

      notification.onerror = (error) => {
        onError?.(error);
      };

      return notification;
    } catch (error) {
      onError?.(error);
      return null;
    }
  }, [canNotify, defaultIcon, defaultBadge, swRegistration, onClick, onClose, onError]);

  // Notificação de sucesso
  const success = useCallback((title, message, options = {}) => {
    return notify(title, {
      body: message,
      icon: options.icon || '/icons/success.png',
      tag: 'success',
      ...options
    });
  }, [notify]);

  // Notificação de erro
  const error = useCallback((title, message, options = {}) => {
    return notify(title, {
      body: message,
      icon: options.icon || '/icons/error.png',
      tag: 'error',
      requireInteraction: true,
      ...options
    });
  }, [notify]);

  // Notificação de aviso
  const warning = useCallback((title, message, options = {}) => {
    return notify(title, {
      body: message,
      icon: options.icon || '/icons/warning.png',
      tag: 'warning',
      ...options
    });
  }, [notify]);

  // Notificação de informação
  const info = useCallback((title, message, options = {}) => {
    return notify(title, {
      body: message,
      icon: options.icon || '/icons/info.png',
      tag: 'info',
      ...options
    });
  }, [notify]);

  // Agendar notificação
  const schedule = useCallback((title, options = {}, delay = 0) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const notification = notify(title, options);
        resolve(notification);
      }, delay);
    });
  }, [notify]);

  // Fechar todas as notificações com tag específica
  const closeByTag = useCallback((tag) => {
    if (swRegistration) {
      swRegistration.getNotifications({ tag }).then(notifications => {
        notifications.forEach(n => n.close());
      });
    }
  }, [swRegistration]);

  // Fechar todas as notificações
  const closeAll = useCallback(() => {
    if (swRegistration) {
      swRegistration.getNotifications().then(notifications => {
        notifications.forEach(n => n.close());
      });
    }
  }, [swRegistration]);

  return {
    // Estado
    permission,
    isSupported,
    canNotify,

    // Ações
    requestPermission,
    notify,

    // Métodos de conveniência
    success,
    error,
    warning,
    info,

    // Utilitários
    schedule,
    closeByTag,
    closeAll,

    // Verificações
    isGranted: permission === 'granted',
    isDenied: permission === 'denied',
    isDefault: permission === 'default'
  };
};

export default useNotification;
export { useNotification };
