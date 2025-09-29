/**
 * Auth Module - Sistema de Autenticação Completo
 * Framework Nexus - Oryum
 */

import { AuthService, initializeAuth, getAuth } from './AuthService.js';
import { AuthMiddleware, getAuthMiddleware, auth, authorize, requireRole, requireOwnership, optionalAuth, rateLimit, auditLog } from './AuthMiddleware.js';

export class AuthModule {
  constructor(config = {}) {
    this.config = config;
    this.service = null;
    this.middleware = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🔐 Inicializando Auth Module...');
      
      // Inicializar serviço de autenticação
      this.service = await initializeAuth(this.config);
      
      // Inicializar middleware
      this.middleware = await getAuthMiddleware();
      
      this.isInitialized = true;
      console.log('✅ Auth Module inicializado com sucesso');
      
      return this;
    } catch (error) {
      console.error('❌ Erro ao inicializar Auth Module:', error);
      throw error;
    }
  }

  // Métodos de conveniência para o serviço
  async register(userData) {
    return await this.service.register(userData);
  }

  async login(email, password, options = {}) {
    return await this.service.login(email, password, options);
  }

  async logout(token, options = {}) {
    return await this.service.logout(token, options);
  }

  async refreshToken(refreshToken) {
    return await this.service.refreshToken(refreshToken);
  }

  async verifyToken(token) {
    return await this.service.verifyToken(token);
  }

  async requestPasswordReset(email) {
    return await this.service.requestPasswordReset(email);
  }

  async resetPassword(token, newPassword) {
    return await this.service.resetPassword(token, newPassword);
  }

  // Getters para middleware
  get authenticate() {
    return this.middleware.authenticate();
  }

  authorize(permission, options = {}) {
    return this.middleware.authorize(permission, options);
  }

  requireRole(roles) {
    return this.middleware.requireRole(roles);
  }

  requireOwnership(resourceParam, resourceModel) {
    return this.middleware.requireOwnership(resourceParam, resourceModel);
  }

  get optionalAuth() {
    return this.middleware.optionalAuth();
  }

  rateLimit(options = {}) {
    return this.middleware.rateLimit(options);
  }

  auditLog(action, resourceType) {
    return this.middleware.auditLog(action, resourceType);
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      service: this.service ? 'initialized' : 'not_initialized',
      middleware: this.middleware ? 'initialized' : 'not_initialized',
      timestamp: new Date()
    };
  }
}

// Singleton instance
let authModule = null;

export async function initializeAuthModule(config = {}) {
  if (!authModule) {
    authModule = new AuthModule(config);
    await authModule.initialize();
  }
  return authModule;
}

export async function getAuthModule() {
  if (!authModule) {
    throw new Error('Auth Module não foi inicializado. Chame initializeAuthModule() primeiro.');
  }
  return authModule;
}

// Exports diretos para conveniência
export {
  AuthService,
  AuthMiddleware,
  initializeAuth,
  getAuth,
  getAuthMiddleware,
  auth,
  authorize,
  requireRole,
  requireOwnership,
  optionalAuth,
  rateLimit,
  auditLog
};

export default AuthModule;