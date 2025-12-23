/**
 * useToast Hook - Nexus Framework
 * Hook para gerenciamento de notificações toast
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// Contador global para IDs únicos
let toastIdCounter = 0;

/**
 * Hook para gerenciar notificações toast
 *
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Estado e ações do toast
 */
const useToast = (options = {}) => {
  const {
    maxToasts = 5,
    defaultDuration = 5000,
    position = 'top-right',
    pauseOnHover = true
  } = options;

  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  // Limpar timeouts no unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Remover toast
  const dismiss = useCallback((id) => {
    // Limpar timeout associado
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }

    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  // Pausar auto-dismiss
  const pause = useCallback((id) => {
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }
  }, []);

  // Resumir auto-dismiss
  const resume = useCallback((id, duration) => {
    const timeout = setTimeout(() => dismiss(id), duration);
    timeoutsRef.current.set(id, timeout);
  }, [dismiss]);

  // Adicionar toast
  const addToast = useCallback((toast) => {
    const id = `toast-${++toastIdCounter}`;
    const duration = toast.duration ?? defaultDuration;

    const newToast = {
      id,
      type: 'info',
      message: '',
      title: '',
      dismissible: true,
      createdAt: Date.now(),
      ...toast
    };

    setToasts(current => {
      // Remover toasts antigos se exceder máximo
      const updated = [...current, newToast];
      if (updated.length > maxToasts) {
        const toRemove = updated.slice(0, updated.length - maxToasts);
        toRemove.forEach(t => {
          if (timeoutsRef.current.has(t.id)) {
            clearTimeout(timeoutsRef.current.get(t.id));
            timeoutsRef.current.delete(t.id);
          }
        });
        return updated.slice(-maxToasts);
      }
      return updated;
    });

    // Auto-dismiss se duração > 0
    if (duration > 0) {
      const timeout = setTimeout(() => dismiss(id), duration);
      timeoutsRef.current.set(id, timeout);
    }

    return id;
  }, [maxToasts, defaultDuration, dismiss]);

  // Métodos de conveniência
  const success = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'success' });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'error', duration: options.duration ?? 8000 });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'warning' });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'info' });
  }, [addToast]);

  // Toast com ação customizada
  const custom = useCallback((content, options = {}) => {
    return addToast({ ...options, content, type: 'custom' });
  }, [addToast]);

  // Toast de loading (sem auto-dismiss)
  const loading = useCallback((message, options = {}) => {
    return addToast({ ...options, message, type: 'loading', duration: 0 });
  }, [addToast]);

  // Atualizar toast existente
  const update = useCallback((id, updates) => {
    setToasts(current =>
      current.map(toast =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );

    // Se mudou para um tipo que permite auto-dismiss
    if (updates.type && updates.type !== 'loading' && updates.duration !== 0) {
      const duration = updates.duration ?? defaultDuration;
      resume(id, duration);
    }

    return id;
  }, [defaultDuration, resume]);

  // Promise toast - mostra loading e depois sucesso/erro
  const promise = useCallback(async (promise, messages) => {
    const { loading: loadingMsg, success: successMsg, error: errorMsg } = messages;

    const id = loading(loadingMsg);

    try {
      const result = await promise;
      update(id, {
        type: 'success',
        message: typeof successMsg === 'function' ? successMsg(result) : successMsg,
        duration: defaultDuration
      });
      return result;
    } catch (err) {
      update(id, {
        type: 'error',
        message: typeof errorMsg === 'function' ? errorMsg(err) : errorMsg,
        duration: 8000
      });
      throw err;
    }
  }, [loading, update, defaultDuration]);

  // Limpar todos os toasts
  const dismissAll = useCallback(() => {
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();
    setToasts([]);
  }, []);

  return {
    // Estado
    toasts,
    position,

    // Métodos de criação
    toast: addToast,
    success,
    error,
    warning,
    info,
    loading,
    custom,
    promise,

    // Métodos de controle
    dismiss,
    dismissAll,
    update,

    // Controle de hover
    pause,
    resume: (id) => resume(id, defaultDuration),
    pauseOnHover,

    // Helpers para componente
    getToastProps: (toast) => ({
      key: toast.id,
      id: toast.id,
      type: toast.type,
      message: toast.message,
      title: toast.title,
      dismissible: toast.dismissible,
      onDismiss: () => dismiss(toast.id),
      onMouseEnter: pauseOnHover ? () => pause(toast.id) : undefined,
      onMouseLeave: pauseOnHover ? () => resume(toast.id, defaultDuration) : undefined
    })
  };
};

export default useToast;
export { useToast };
