/**
 * useDebounce Hook - Nexus Framework
 * Hook para debounce de valores e funções
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para debounce de valores
 * Atrasa a atualização do valor até que não haja mudanças por um período
 *
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em milissegundos (default: 300ms)
 * @returns {any} - Valor debounced
 */
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce de funções
 * Cria uma versão debounced de uma função
 *
 * @param {Function} fn - Função a ser debounced
 * @param {number} delay - Delay em milissegundos (default: 300ms)
 * @param {Object} options - Opções adicionais
 * @returns {Object} - { debouncedFn, cancel, flush, pending }
 */
const useDebouncedCallback = (fn, delay = 300, options = {}) => {
  const { leading = false, trailing = true } = options;

  const timeoutRef = useRef(null);
  const fnRef = useRef(fn);
  const pendingRef = useRef(false);
  const argsRef = useRef(null);

  // Manter referência atualizada da função
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  // Limpar timeout no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Cancelar debounce pendente
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingRef.current = false;
    argsRef.current = null;
  }, []);

  // Executar imediatamente
  const flush = useCallback(() => {
    if (timeoutRef.current && argsRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
      fnRef.current(...argsRef.current);
      pendingRef.current = false;
      argsRef.current = null;
    }
  }, []);

  // Função debounced
  const debouncedFn = useCallback((...args) => {
    argsRef.current = args;

    // Leading: executar na primeira chamada
    if (leading && !pendingRef.current) {
      fnRef.current(...args);
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    pendingRef.current = true;

    // Trailing: executar após o delay
    timeoutRef.current = setTimeout(() => {
      if (trailing && (!leading || argsRef.current !== args)) {
        fnRef.current(...argsRef.current);
      }
      pendingRef.current = false;
      argsRef.current = null;
    }, delay);
  }, [delay, leading, trailing]);

  return {
    debouncedFn,
    cancel,
    flush,
    pending: pendingRef.current
  };
};

/**
 * Hook para throttle de funções
 * Limita a execução de uma função a uma vez por período
 *
 * @param {Function} fn - Função a ser throttled
 * @param {number} limit - Limite em milissegundos (default: 300ms)
 * @returns {Function} - Função throttled
 */
const useThrottle = (fn, limit = 300) => {
  const lastRunRef = useRef(0);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const throttledFn = useCallback((...args) => {
    const now = Date.now();

    if (now - lastRunRef.current >= limit) {
      lastRunRef.current = now;
      fnRef.current(...args);
    }
  }, [limit]);

  return throttledFn;
};

export default useDebounce;
export { useDebounce, useDebouncedCallback, useThrottle };
