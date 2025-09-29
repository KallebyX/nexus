/**
 * Auth Middleware - Middlewares de Autenticação e Autorização
 * Framework Nexus - Oryum
 */

import { getAuth } from './AuthService.js';
import { getDatabase } from '../database/index.js';

export class AuthMiddleware {
  constructor() {
    this.auth = null;
    this.db = null;
  }

  async initialize() {
    this.auth = await getAuth();
    this.db = await getDatabase();
  }

  // Middleware para autenticar requests
  authenticate() {
    return async (req, res, next) => {
      try {
        if (!this.auth) await this.initialize();
        
        const token = this.extractToken(req);
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Token de acesso requerido',
            code: 'MISSING_TOKEN'
          });
        }
        
        const verification = await this.auth.verifyToken(token);
        
        if (!verification.valid) {
          return res.status(401).json({
            success: false,
            error: 'Token inválido ou expirado',
            code: 'INVALID_TOKEN'
          });
        }
        
        // Adicionar dados do usuário ao request
        req.user = verification.user;
        req.session = verification.session;
        
        next();
        
      } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(401).json({
          success: false,
          error: 'Falha na autenticação',
          code: 'AUTH_ERROR'
        });
      }
    };
  }

  // Middleware para autorizar baseado em permissões
  authorize(permission, options = {}) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            code: 'NOT_AUTHENTICATED'
          });
        }
        
        // Buscar usuário completo com permissões
        const user = await this.db.User.findByPk(req.user.id, {
          include: [
            {
              model: this.db.Role,
              as: 'role',
              include: ['permissions']
            },
            {
              model: this.db.Permission,
              as: 'permissions'
            }
          ]
        });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não encontrado',
            code: 'USER_NOT_FOUND'
          });
        }
        
        // Verificar permissão
        const hasPermission = await user.hasPermission(permission, options.target);
        
        if (!hasPermission) {
          // Log da tentativa de acesso negado
          await this.db.ActivityLog.create({
            user_id: user.id,
            action: 'access_denied',
            resource_type: 'Permission',
            details: {
              required_permission: permission,
              user_permissions: await user.getPermissionsList(),
              target: options.target
            },
            ip_address: this.getClientIP(req),
            user_agent: req.get('User-Agent')
          });
          
          return res.status(403).json({
            success: false,
            error: 'Permissão insuficiente',
            code: 'INSUFFICIENT_PERMISSION',
            required: permission
          });
        }
        
        // Atualizar request com usuário completo
        req.user = user.toSafeJSON();
        next();
        
      } catch (error) {
        console.error('Erro na autorização:', error);
        return res.status(500).json({
          success: false,
          error: 'Falha na autorização',
          code: 'AUTHORIZATION_ERROR'
        });
      }
    };
  }

  // Middleware para verificar roles
  requireRole(roles) {
    const roleList = Array.isArray(roles) ? roles : [roles];
    
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            code: 'NOT_AUTHENTICATED'
          });
        }
        
        const user = await this.db.User.findByPk(req.user.id, {
          include: ['role']
        });
        
        if (!user || !user.role || !roleList.includes(user.role.name)) {
          return res.status(403).json({
            success: false,
            error: 'Role insuficiente',
            code: 'INSUFFICIENT_ROLE',
            required: roleList,
            current: user.role?.name
          });
        }
        
        next();
        
      } catch (error) {
        console.error('Erro na verificação de role:', error);
        return res.status(500).json({
          success: false,
          error: 'Falha na verificação de role',
          code: 'ROLE_CHECK_ERROR'
        });
      }
    };
  }

  // Middleware para recursos próprios (own resources)
  requireOwnership(resourceParam = 'id', resourceModel = 'User') {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            success: false,
            error: 'Usuário não autenticado',
            code: 'NOT_AUTHENTICATED'
          });
        }
        
        const resourceId = req.params[resourceParam];
        
        if (!resourceId) {
          return res.status(400).json({
            success: false,
            error: `Parâmetro ${resourceParam} requerido`,
            code: 'MISSING_RESOURCE_ID'
          });
        }
        
        // Para recursos de usuário, verificar se é o próprio usuário
        if (resourceModel === 'User' && resourceId !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Acesso permitido apenas aos próprios recursos',
            code: 'NOT_OWNER'
          });
        }
        
        // Para outros recursos, verificar ownership
        const Model = this.db[resourceModel];
        if (Model) {
          const resource = await Model.findByPk(resourceId);
          
          if (!resource) {
            return res.status(404).json({
              success: false,
              error: 'Recurso não encontrado',
              code: 'RESOURCE_NOT_FOUND'
            });
          }
          
          if (resource.user_id && resource.user_id !== req.user.id) {
            return res.status(403).json({
              success: false,
              error: 'Acesso permitido apenas ao proprietário',
              code: 'NOT_OWNER'
            });
          }
          
          req.resource = resource;
        }
        
        next();
        
      } catch (error) {
        console.error('Erro na verificação de ownership:', error);
        return res.status(500).json({
          success: false,
          error: 'Falha na verificação de propriedade',
          code: 'OWNERSHIP_CHECK_ERROR'
        });
      }
    };
  }

  // Middleware para rate limiting por usuário
  rateLimit(options = {}) {
    const {
      windowMs = 60000, // 1 minuto
      max = 100, // 100 requests por minuto
      message = 'Muitas requisições, tente novamente mais tarde'
    } = options;
    
    const requests = new Map();
    
    return (req, res, next) => {
      const userId = req.user?.id || this.getClientIP(req);
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(userId)) {
        requests.set(userId, []);
      }
      
      const userRequests = requests.get(userId);
      
      // Remover requests antigos
      const validRequests = userRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= max) {
        return res.status(429).json({
          success: false,
          error: message,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((validRequests[0] - windowStart) / 1000)
        });
      }
      
      validRequests.push(now);
      requests.set(userId, validRequests);
      
      next();
    };
  }

  // Middleware opcional (não bloqueia se não autenticado)
  optionalAuth() {
    return async (req, res, next) => {
      try {
        if (!this.auth) await this.initialize();
        
        const token = this.extractToken(req);
        
        if (token) {
          const verification = await this.auth.verifyToken(token);
          
          if (verification.valid) {
            req.user = verification.user;
            req.session = verification.session;
          }
        }
        
        next();
        
      } catch (error) {
        // Em caso de erro, continuar sem autenticação
        next();
      }
    };
  }

  // Middleware para logs de auditoria
  auditLog(action, resourceType = 'Unknown') {
    return async (req, res, next) => {
      try {
        // Interceptar resposta para log após completar
        const originalSend = res.send;
        
        res.send = function(data) {
          // Log da atividade
          if (req.user) {
            const logData = {
              user_id: req.user.id,
              action,
              resource_type: resourceType,
              resource_id: req.params.id,
              details: {
                method: req.method,
                url: req.originalUrl,
                body: req.method !== 'GET' ? req.body : undefined,
                response_status: res.statusCode
              },
              ip_address: req.ip || req.connection.remoteAddress,
              user_agent: req.get('User-Agent')
            };
            
            // Log assíncrono para não impactar performance
            setImmediate(async () => {
              try {
                await req.app.locals.db.ActivityLog.create(logData);
              } catch (error) {
                console.error('Erro ao criar log de auditoria:', error);
              }
            });
          }
          
          originalSend.call(this, data);
        };
        
        next();
        
      } catch (error) {
        console.error('Erro no middleware de auditoria:', error);
        next();
      }
    };
  }

  // Utilitários
  extractToken(req) {
    const authHeader = req.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    
    // Verificar em cookies também
    return req.cookies?.access_token || null;
  }

  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
  }
}

// Instance singleton
let middlewareInstance = null;

export async function getAuthMiddleware() {
  if (!middlewareInstance) {
    middlewareInstance = new AuthMiddleware();
    await middlewareInstance.initialize();
  }
  return middlewareInstance;
}

// Exports de conveniência
export const auth = () => middlewareInstance?.authenticate() || ((req, res, next) => next());
export const authorize = (permission, options) => middlewareInstance?.authorize(permission, options) || ((req, res, next) => next());
export const requireRole = (roles) => middlewareInstance?.requireRole(roles) || ((req, res, next) => next());
export const requireOwnership = (param, model) => middlewareInstance?.requireOwnership(param, model) || ((req, res, next) => next());
export const optionalAuth = () => middlewareInstance?.optionalAuth() || ((req, res, next) => next());
export const rateLimit = (options) => middlewareInstance?.rateLimit(options) || ((req, res, next) => next());
export const auditLog = (action, resourceType) => middlewareInstance?.auditLog(action, resourceType) || ((req, res, next) => next());

export default AuthMiddleware;