/**
 * Componentes UI - Nexus Framework
 * Biblioteca de componentes reutilizáveis
 */

// Layout Components
export { default as Footer } from './Footer.jsx';

// Form Components
export { default as LoginForm } from './LoginForm.jsx';

// UI Components
export { default as Button } from './Button.jsx';
export { default as Input } from './Input.jsx';
export { default as Alert } from './Alert.jsx';

// Variantes específicas do Footer
export { 
  EcommerceFooter, 
  SaaSFooter, 
  MinimalFooter 
} from './Footer.jsx';

// Variantes do Button
export {
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  WarningButton,
  ErrorButton,
  OutlineButton,
  GhostButton,
  LinkButton
} from './Button.jsx';

// Variantes do Input
export {
  PasswordInput,
  SearchInput,
  NumberInput,
  EmailInput
} from './Input.jsx';

// Variantes do Alert
export {
  SuccessAlert,
  ErrorAlert,
  WarningAlert,
  InfoAlert,
  ActionAlert,
  InlineAlert
} from './Alert.jsx';
export { default as CartSummary } from './CartSummary.jsx';
export { default as CheckoutForm } from './CheckoutForm.jsx';
export { default as PaymentMethods } from './PaymentMethods.jsx';

// Dashboard Components
export { default as DashboardLayout } from './DashboardLayout.jsx';
export { default as StatsCard } from './StatsCard.jsx';
export { default as Chart } from './Chart.jsx';
export { default as DataTable } from './DataTable.jsx';