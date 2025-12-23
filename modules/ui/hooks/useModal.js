/**
 * useModal Hook - Nexus Framework
 * Hook para gerenciamento de modais/dialogs
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook para controlar modais com suporte a:
 * - Múltiplos modais empilhados
 * - Fechar com ESC
 * - Prevenir scroll do body quando aberto
 * - Callbacks de open/close
 *
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Estado e ações do modal
 */
const useModal = (options = {}) => {
  const {
    defaultOpen = false,
    closeOnEscape = true,
    closeOnOverlayClick = true,
    preventScroll = true,
    onOpen,
    onClose
  } = options;

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);

  // Abrir modal
  const open = useCallback((modalData = null) => {
    setData(modalData);
    setIsOpen(true);
    onOpen?.(modalData);
  }, [onOpen]);

  // Fechar modal
  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.(data);
    setData(null);
  }, [onClose, data]);

  // Toggle modal
  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Fechar com ESC
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, close]);

  // Prevenir scroll do body
  useEffect(() => {
    if (!preventScroll || typeof document === 'undefined') return;

    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, preventScroll]);

  // Handler para click no overlay
  const handleOverlayClick = useCallback((event) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      close();
    }
  }, [closeOnOverlayClick, close]);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    handleOverlayClick,
    // Props para o modal component
    modalProps: {
      isOpen,
      onClose: close,
      onOverlayClick: handleOverlayClick
    }
  };
};

export default useModal;
export { useModal };
