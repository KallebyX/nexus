/**
 * Constantes - Nexus Framework
 * Valores e configurações padrão reutilizáveis
 */

// Status de Resposta HTTP
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Tipos de Arquivo Permitidos
export const FILE_TYPES = {
  IMAGES: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENTS: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
  VIDEOS: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
  AUDIO: ['mp3', 'wav', 'ogg', 'aac', 'flac'],
  CODE: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml'],
  COMPRESSED: ['zip', 'rar', '7z', 'tar', 'gz']
};

// Limites de Tamanho
export const SIZE_LIMITS = {
  AVATAR_MAX_SIZE: 2, // MB
  DOCUMENT_MAX_SIZE: 10, // MB
  VIDEO_MAX_SIZE: 100, // MB
  BULK_UPLOAD_MAX_FILES: 10
};

// Configurações de Paginação
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 5
};

// Cores do Sistema
export const COLORS = {
  PRIMARY: '#3B82F6',
  SECONDARY: '#6B7280',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  LIGHT: '#F8FAFC',
  DARK: '#1F2937'
};

// Breakpoints Responsivos
export const BREAKPOINTS = {
  XS: '(max-width: 639px)',
  SM: '(min-width: 640px)',
  MD: '(min-width: 768px)',
  LG: '(min-width: 1024px)',
  XL: '(min-width: 1280px)',
  '2XL': '(min-width: 1536px)'
};

// Configurações de Cache
export const CACHE = {
  SHORT_TTL: 5 * 60 * 1000, // 5 minutos
  MEDIUM_TTL: 30 * 60 * 1000, // 30 minutos
  LONG_TTL: 24 * 60 * 60 * 1000, // 24 horas
  WEEK_TTL: 7 * 24 * 60 * 60 * 1000 // 1 semana
};

// Configurações de Debounce/Throttle
export const DELAYS = {
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 500,
  API_THROTTLE: 1000,
  SCROLL_THROTTLE: 100
};

// Mensagens de Erro Padrão
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: 'Este campo é obrigatório',
  INVALID_EMAIL: 'Digite um email válido',
  INVALID_CPF: 'CPF inválido',
  INVALID_CNPJ: 'CNPJ inválido',
  INVALID_PHONE: 'Telefone inválido',
  WEAK_PASSWORD: 'Senha deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo',
  PASSWORD_MISMATCH: 'Senhas não coincidem',
  FILE_TOO_LARGE: 'Arquivo muito grande',
  INVALID_FILE_TYPE: 'Tipo de arquivo não permitido',
  NETWORK_ERROR: 'Erro de conexão. Tente novamente.',
  UNAUTHORIZED: 'Acesso não autorizado',
  FORBIDDEN: 'Permissão insuficiente',
  NOT_FOUND: 'Recurso não encontrado',
  SERVER_ERROR: 'Erro interno do servidor'
};

// Mensagens de Sucesso Padrão
export const SUCCESS_MESSAGES = {
  SAVED: 'Salvo com sucesso!',
  UPDATED: 'Atualizado com sucesso!',
  DELETED: 'Excluído com sucesso!',
  SENT: 'Enviado com sucesso!',
  UPLOADED: 'Upload realizado com sucesso!',
  LOGGED_IN: 'Login realizado com sucesso!',
  LOGGED_OUT: 'Logout realizado com sucesso!',
  REGISTERED: 'Cadastro realizado com sucesso!'
};

// Tipos de Notificação
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Roles/Permissões Padrão
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  USER: 'user',
  GUEST: 'guest'
};

// Status de Pedido/Transação
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
};

// Métodos de Pagamento
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PIX: 'pix',
  BOLETO: 'boleto',
  PAYPAL: 'paypal',
  STRIPE: 'stripe'
};

// Configurações de Validação
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  COMMENT_MAX_LENGTH: 1000
};

// Configurações de API
export const API_CONFIG = {
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 segundo
};

// Configurações de SEO
export const SEO_DEFAULTS = {
  TITLE_MAX_LENGTH: 60,
  DESCRIPTION_MAX_LENGTH: 160,
  KEYWORDS_MAX_COUNT: 10
};

// Configurações de Localização
export const LOCALES = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US',
  ES_ES: 'es-ES'
};

// Moedas Suportadas
export const CURRENCIES = {
  BRL: 'BRL',
  USD: 'USD',
  EUR: 'EUR'
};

// Configurações de Rate Limiting
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  API_REQUESTS_PER_MINUTE: 60,
  PASSWORD_RESET_ATTEMPTS: 3
};

// Configurações de Sessão
export const SESSION_CONFIG = {
  TIMEOUT: 24 * 60 * 60 * 1000, // 24 horas
  REFRESH_THRESHOLD: 15 * 60 * 1000, // 15 minutos
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000 // 30 dias
};