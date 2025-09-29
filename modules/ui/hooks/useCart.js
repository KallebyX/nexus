/**
 * Hook useCart - Nexus UI
 * Hook para gerenciamento de carrinho de compras
 */

import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage.js';

const useCart = (options = {}) => {
  const {
    storageKey = 'nexus-cart',
    maxItems = 100,
    onCartChange,
    persistToServer = false,
    apiEndpoint = '/api/cart'
  } = options;

  const [cartItems, setCartItems] = useLocalStorage(storageKey, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcular totais
  const totals = {
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    uniqueItems: cartItems.length
  };

  // Adicionar item ao carrinho
  const addItem = useCallback((product, quantity = 1, options = {}) => {
    setCartItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        item => item.id === product.id && 
        JSON.stringify(item.options) === JSON.stringify(options)
      );

      let newItems;
      
      if (existingItemIndex > -1) {
        // Item já existe, atualizar quantidade
        newItems = [...currentItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity
        };
      } else {
        // Novo item
        if (currentItems.length >= maxItems) {
          setError(`Máximo de ${maxItems} itens no carrinho`);
          return currentItems;
        }

        newItems = [...currentItems, {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity,
          options,
          addedAt: new Date().toISOString()
        }];
      }

      if (onCartChange) {
        onCartChange(newItems, 'add', product);
      }

      return newItems;
    });
  }, [maxItems, onCartChange, setCartItems]);

  // Remover item do carrinho
  const removeItem = useCallback((itemId, options = {}) => {
    setCartItems(currentItems => {
      const newItems = currentItems.filter(
        item => !(item.id === itemId && 
        JSON.stringify(item.options) === JSON.stringify(options))
      );

      if (onCartChange) {
        const removedItem = currentItems.find(
          item => item.id === itemId && 
          JSON.stringify(item.options) === JSON.stringify(options)
        );
        onCartChange(newItems, 'remove', removedItem);
      }

      return newItems;
    });
  }, [onCartChange, setCartItems]);

  // Atualizar quantidade
  const updateQuantity = useCallback((itemId, quantity, options = {}) => {
    if (quantity <= 0) {
      removeItem(itemId, options);
      return;
    }

    setCartItems(currentItems => {
      const newItems = currentItems.map(item => {
        if (item.id === itemId && 
            JSON.stringify(item.options) === JSON.stringify(options)) {
          return { ...item, quantity };
        }
        return item;
      });

      if (onCartChange) {
        const updatedItem = newItems.find(
          item => item.id === itemId && 
          JSON.stringify(item.options) === JSON.stringify(options)
        );
        onCartChange(newItems, 'update', updatedItem);
      }

      return newItems;
    });
  }, [removeItem, onCartChange, setCartItems]);

  // Limpar carrinho
  const clearCart = useCallback(() => {
    setCartItems([]);
    if (onCartChange) {
      onCartChange([], 'clear');
    }
  }, [onCartChange, setCartItems]);

  // Verificar se item está no carrinho
  const isInCart = useCallback((itemId, options = {}) => {
    return cartItems.some(
      item => item.id === itemId && 
      JSON.stringify(item.options) === JSON.stringify(options)
    );
  }, [cartItems]);

  // Obter item específico
  const getItem = useCallback((itemId, options = {}) => {
    return cartItems.find(
      item => item.id === itemId && 
      JSON.stringify(item.options) === JSON.stringify(options)
    );
  }, [cartItems]);

  // Aplicar cupom de desconto
  const applyCoupon = useCallback(async (couponCode) => {
    try {
      setLoading(true);
      setError(null);

      // Simular validação de cupom - integrar com API real
      const response = await fetch(`${apiEndpoint}/coupon/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode,
          cartTotal: totals.totalPrice
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          discount: result.discount,
          discountedTotal: totals.totalPrice - result.discount
        };
      } else {
        setError(result.error || 'Cupom inválido');
        return { success: false, error: result.error };
      }
    } catch (error) {
      setError('Erro ao validar cupom');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, totals.totalPrice]);

  // Sincronizar com servidor
  const syncWithServer = useCallback(async () => {
    if (!persistToServer) return;

    try {
      setLoading(true);
      
      const response = await fetch(`${apiEndpoint}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartItems })
      });

      const result = await response.json();
      
      if (result.success) {
        setCartItems(result.cartItems);
      }
    } catch (error) {
      console.error('Erro ao sincronizar carrinho:', error);
    } finally {
      setLoading(false);
    }
  }, [persistToServer, apiEndpoint, cartItems, setCartItems]);

  // Migrar carrinho para usuário logado
  const migrateCart = useCallback(async (userId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${apiEndpoint}/migrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          localCart: cartItems 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setCartItems(result.mergedCart);
        return { success: true };
      }
    } catch (error) {
      console.error('Erro ao migrar carrinho:', error);
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, cartItems, setCartItems]);

  // Estimar frete
  const calculateShipping = useCallback(async (shippingData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${apiEndpoint}/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shipping: shippingData
        })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      setError('Erro ao calcular frete');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, cartItems]);

  // Effect para sincronização automática
  useEffect(() => {
    if (persistToServer && cartItems.length > 0) {
      const timeoutId = setTimeout(syncWithServer, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, persistToServer, syncWithServer]);

  return {
    // Estado
    items: cartItems,
    loading,
    error,
    totals,

    // Ações
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    
    // Consultas
    isInCart,
    getItem,
    isEmpty: cartItems.length === 0,
    
    // Funcionalidades avançadas
    applyCoupon,
    calculateShipping,
    syncWithServer,
    migrateCart,
    
    // Utilitários
    clearError: () => setError(null)
  };
};

export default useCart;