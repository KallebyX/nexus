/**
 * Hooks - Nexus Framework
 * Hooks React reutilizáveis
 */

export { useAuth } from './useAuth.js';
export { useCart } from './useCart.js';
export { useForm } from './useForm.js';
export { useApi, useApiRequest, useFetch, usePagination } from './useApi.js';

// UI State Hooks
export { default as useModal } from './useModal.js';
export { default as useToggle } from './useToggle.js';
export { default as useLocalStorage } from './useLocalStorage.js';
export { default as useDebounce } from './useDebounce.js';

// Payment Hooks
export { default as usePayment } from './usePayment.js';
export { default as useStripe } from './useStripe.js';
export { default as useSubscription } from './useSubscription.js';

// Notification Hooks
export { default as useNotification } from './useNotification.js';
export { default as useToast } from './useToast.js';

// E-commerce Hooks
export { default as useCart } from './useCart.js';
export { default as useWishlist } from './useWishlist.js';
export { default as useCheckout } from './useCheckout.js';