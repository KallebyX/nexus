/**
 * Hooks - Nexus Framework
 * Complete React Hooks Library
 *
 * @module Nexus/UI/Hooks
 * @version 2.0.0
 */

// Authentication Hook
export { default as useAuth, AuthProvider, AuthContext } from './useAuth.js';

// Form Management Hook
export { useForm } from './useForm.js';

// API & Data Fetching Hooks
export { useApi, useApiRequest, useFetch, usePagination } from './useApi.js';

// State Management Hooks
export { default as useLocalStorage } from './useLocalStorage.js';
export { default as useToggle } from './useToggle.js';
export { default as useModal } from './useModal.js';

// Performance Hooks
export { default as useDebounce, useDebouncedCallback, useThrottle } from './useDebounce.js';

// Notification Hooks
export { default as useToast } from './useToast.js';
export { default as useNotification } from './useNotification.js';

// E-commerce Hook
export { default as useCart } from './useCart.js';

// Payment Hooks (placeholders - implement with payment provider)
export const usePayment = { name: 'usePayment', type: 'hook', description: 'Hook for payment processing' };
export const useStripe = { name: 'useStripe', type: 'hook', description: 'Hook for Stripe integration' };
export const useSubscription = { name: 'useSubscription', type: 'hook', description: 'Hook for subscription management' };

// Additional E-commerce Hooks (placeholders)
export const useWishlist = { name: 'useWishlist', type: 'hook', description: 'Hook for wishlist management' };
export const useCheckout = { name: 'useCheckout', type: 'hook', description: 'Hook for checkout flow' };
