/**
 * Hooks - Nexus Framework
 * Hooks React reutilizáveis
 */

export { useAuth } from './useAuth.js';
// export { useCart } from './useCart.js'; // Movido para linha 27
export { useForm } from './useForm.js';
export { useApi, useApiRequest, useFetch, usePagination } from './useApi.js';

// Hooks básicos disponíveis - outros são opcionais para React
// UI State Hooks - apenas templates para Node.js
export const useModal = { name: 'useModal', type: 'hook' };
export const useToggle = { name: 'useToggle', type: 'hook' };
export const useLocalStorage = { name: 'useLocalStorage', type: 'hook' };
export const useDebounce = { name: 'useDebounce', type: 'hook' };

// Payment Hooks 
export const usePayment = { name: 'usePayment', type: 'hook' };
export const useStripe = { name: 'useStripe', type: 'hook' };
export const useSubscription = { name: 'useSubscription', type: 'hook' };

// Notification Hooks
export const useNotification = { name: 'useNotification', type: 'hook' };
export const useToast = { name: 'useToast', type: 'hook' };

// E-commerce Hooks
export const useCartHook = { name: 'useCart', type: 'hook' };
export const useWishlist = { name: 'useWishlist', type: 'hook' };
export const useCheckout = { name: 'useCheckout', type: 'hook' };