/**
 * useLocalStorage Hook - Nexus Framework
 * Hook para persistência de dados no localStorage com sincronização entre tabs
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar dados no localStorage com suporte a:
 * - Persistência automática
 * - Sincronização entre abas do navegador
 * - Serialização/deserialização JSON
 * - Valores default e fallback
 *
 * @param {string} key - Chave do localStorage
 * @param {any} initialValue - Valor inicial se não existir no storage
 * @param {Object} options - Opções de configuração
 * @returns {[any, Function, Function]} - [valor, setValue, removeValue]
 */
const useLocalStorage = (key, initialValue, options = {}) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    syncTabs = true,
    onError = console.error
  } = options;

  // Estado para armazenar o valor
  // Usar função para inicialização lazy (evita leitura desnecessária do localStorage)
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? deserialize(item) : initialValue;
    } catch (error) {
      onError(`Erro ao ler localStorage[${key}]:`, error);
      return initialValue;
    }
  });

  // Função para atualizar o valor
  const setValue = useCallback((value) => {
    try {
      // Permitir valor como função (como useState)
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serialize(valueToStore));

        // Disparar evento customizado para sincronização
        window.dispatchEvent(new CustomEvent('local-storage-change', {
          detail: { key, value: valueToStore }
        }));
      }
    } catch (error) {
      onError(`Erro ao salvar localStorage[${key}]:`, error);
    }
  }, [key, serialize, storedValue, onError]);

  // Função para remover o valor
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);

        window.dispatchEvent(new CustomEvent('local-storage-change', {
          detail: { key, value: null }
        }));
      }
    } catch (error) {
      onError(`Erro ao remover localStorage[${key}]:`, error);
    }
  }, [key, initialValue, onError]);

  // Sincronizar entre abas do navegador
  useEffect(() => {
    if (!syncTabs || typeof window === 'undefined') return;

    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(deserialize(event.newValue));
        } catch (error) {
          onError(`Erro ao sincronizar localStorage[${key}]:`, error);
        }
      } else if (event.key === key && event.newValue === null) {
        setStoredValue(initialValue);
      }
    };

    // Evento nativo do storage (outras abas)
    window.addEventListener('storage', handleStorageChange);

    // Evento customizado (mesma aba)
    const handleCustomChange = (event) => {
      if (event.detail.key === key) {
        setStoredValue(event.detail.value ?? initialValue);
      }
    };
    window.addEventListener('local-storage-change', handleCustomChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-change', handleCustomChange);
    };
  }, [key, deserialize, syncTabs, initialValue, onError]);

  return [storedValue, setValue, removeValue];
};

export default useLocalStorage;
export { useLocalStorage };
