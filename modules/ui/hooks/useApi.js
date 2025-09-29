/**
 * API Hook - Nexus Framework
 * Hook para requisições HTTP com cache e estados
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClient, RequestCache, withRetry } from '../../../utils/api.js';
import { isFunction } from '../../../utils/types.js';

// Cache global para requisições
const globalCache = new RequestCache();

export const useApi = (baseURL, options = {}) => {
  const {
    defaultHeaders = {},
    enableCache = true,
    retryAttempts = 3,
    timeout = 10000
  } = options;

  // Criar cliente API
  const apiClient = useRef(new ApiClient(baseURL, defaultHeaders)).current;

  // Estado da API
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Método para requisições com cache
  const request = useCallback(async (endpoint, config = {}) => {
    const cacheKey = `${endpoint}_${JSON.stringify(config)}`;
    
    // Verificar cache se habilitado e é GET
    if (enableCache && (!config.method || config.method === 'GET')) {
      const cached = globalCache.get(cacheKey);
      if (cached) return cached;
    }

    // Fazer requisição com retry
    const makeRequest = () => apiClient.request(endpoint, config);
    const result = await withRetry(makeRequest, retryAttempts);

    // Armazenar no cache se habilitado e é GET
    if (enableCache && (!config.method || config.method === 'GET')) {
      globalCache.set(cacheKey, result);
    }

    return result;
  }, [apiClient, enableCache, retryAttempts]);

  // Métodos HTTP
  const get = useCallback((endpoint, params = {}) => {
    return request(endpoint, { method: 'GET', params });
  }, [request]);

  const post = useCallback((endpoint, data = {}) => {
    return request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }, [request]);

  const put = useCallback((endpoint, data = {}) => {
    return request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }, [request]);

  const patch = useCallback((endpoint, data = {}) => {
    return request(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }, [request]);

  const del = useCallback((endpoint) => {
    return request(endpoint, { method: 'DELETE' });
  }, [request]);

  // Upload com progresso
  const upload = useCallback((endpoint, file, onProgress) => {
    return apiClient.upload(endpoint, file, onProgress);
  }, [apiClient]);

  // Limpar cache
  const clearCache = useCallback(() => {
    globalCache.clear();
  }, []);

  return {
    // Estado
    isOnline,
    
    // Métodos HTTP
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    request,
    
    // Utilitários
    clearCache,
    
    // Cliente direto
    client: apiClient
  };
};

// Hook para requisições específicas com estado
export const useApiRequest = (requestFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Função para executar a requisição
  const execute = useCallback(async (...args) => {
    if (!isFunction(requestFn)) {
      setError(new Error('requestFn deve ser uma função'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestFn(...args);
      if (mountedRef.current) {
        setData(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
      throw err;
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [requestFn]);

  // Executar automaticamente quando dependências mudarem
  useEffect(() => {
    if (dependencies.length > 0) {
      execute();
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    retry: execute
  };
};

// Hook para fetch de dados simples
export const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url, options);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (!isCancelled) {
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    if (url) {
      fetchData();
    }

    return () => {
      isCancelled = true;
    };
  }, [url, JSON.stringify(options)]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error };
};

// Hook para paginação
export const usePagination = (fetchFn, initialPage = 1, pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar dados da página
  const loadPage = useCallback(async (page) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn({
        page,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      setData(result.data || result.items || result);
      setTotalPages(result.totalPages || Math.ceil((result.total || 0) / pageSize));
      setTotalItems(result.total || result.count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageSize]);

  // Ir para próxima página
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      loadPage(currentPage + 1);
    }
  }, [currentPage, totalPages, loadPage]);

  // Ir para página anterior
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      loadPage(currentPage - 1);
    }
  }, [currentPage, loadPage]);

  // Ir para página específica
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      loadPage(page);
    }
  }, [totalPages, loadPage]);

  // Carregar primeira página no mount
  useEffect(() => {
    loadPage(initialPage);
  }, [loadPage, initialPage]);

  return {
    // Dados
    data,
    currentPage,
    totalPages,
    totalItems,
    loading,
    error,
    
    // Métodos
    nextPage,
    prevPage,
    goToPage,
    reload: () => loadPage(currentPage),
    
    // Estado
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    pageSize
  };
};