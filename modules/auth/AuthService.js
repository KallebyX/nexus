/**
 * Auth Service - Sistema de Autenticação
 * Framework Nexus - Oryum
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDatabase } from '../database/index.js';

export class AuthService {
  constructor(config = {}) {
    this.config = {
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'nexus-default-secret',
      jwtExpiresIn: config.jwtExpiresIn || '7d',
      jwtRefreshExpiresIn: config.jwtRefreshExpiresIn || '30d',
      maxLoginAttempts: config.maxLoginAttempts || 5,
      lockoutDuration: config.lockoutDuration || 900, // 15 minutos
      passwordMinLength: config.passwordMinLength || 8,
      requireUppercase: config.requireUppercase || true,
      requireLowercase: config.requireLowercase || true,
      requireNumbers: config.requireNumbers || true,
      requireSpecialChars: config.requireSpecialChars || false,
      ...config
    };
    
    this.db = null;
  }

  async initialize() {
    this.db = await getDatabase();
    return this;
  }

  // Registro de usuário
  async register(userData) {
    try {
      const { email, password, first_name, last_name, role = 'user', ...extraData } = userData;
      
      // Validar dados obrigatórios
      if (!email || !password || !first_name) {
        throw new Error('Email, senha e nome são obrigatórios');
      }
      
      // Verificar se usuário já existe
      const existingUser = await this.db.User.findOne({ where: { email } });
      if (existingUser) {
        throw new Error('Usuário já existe com este email');
      }
      
      // Validar senha
      this.validatePassword(password);
      
      // Buscar role padrão se não especificada
      let userRole = await this.db.Role.findOne({ where: { name: role } });
      if (!userRole) {
        userRole = await this.db.Role.getDefaultRole();
      }
      
      // Criar usuário
      const user = await this.db.User.create({
        email: email.toLowerCase(),
        first_name,
        last_name,
        password_hash: password, // Será hasheado automaticamente no modelo
        role_id: userRole?.id,
        status: 'pending_verification',
        ...extraData
      });
      
      // Log da atividade
      await this.db.ActivityLog.create({
        user_id: user.id,
        action: 'user_registered',
        resource_type: 'User',
        resource_id: user.id,
        details: {
          email: user.email,
          role: role,
          registration_method: 'email'
        },
        ip_address: extraData.ip_address,
        user_agent: extraData.user_agent
      });
      
      return {
        success: true,
        user: user.toSafeJSON(),
        message: 'Usuário registrado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  }

  // Login do usuário
  async login(email, password, options = {}) {
    try {
      const { device_info, ip_address, user_agent } = options;
      
      // Buscar usuário
      const user = await this.db.User.findOne({ 
        where: { email: email.toLowerCase() },
        include: ['role']
      });
      
      if (!user) {
        await this.logFailedLogin(null, email, 'user_not_found', { ip_address, user_agent });
        throw new Error('Credenciais inválidas');
      }
      
      // Verificar se conta está bloqueada
      if (user.isLocked()) {
        await this.logFailedLogin(user.id, email, 'account_locked', { ip_address, user_agent });
        throw new Error('Conta bloqueada devido a muitas tentativas de login');
      }
      
      // Verificar senha
      const isValidPassword = await user.comparePassword(password);
      
      if (!isValidPassword) {
        await user.recordFailedLogin();
        await this.logFailedLogin(user.id, email, 'invalid_password', { ip_address, user_agent });
        
        const remainingAttempts = this.config.maxLoginAttempts - user.failed_login_attempts;
        throw new Error(`Senha incorreta. ${remainingAttempts} tentativas restantes`);
      }
      
      // Reset tentativas falhas
      await user.resetFailedLogins();
      
      // Atualizar último login
      await user.updateLastLogin(ip_address, user_agent);
      
      // Gerar tokens
      const tokens = await this.generateTokens(user, device_info);
      
      // Log de login bem-sucedido
      await this.db.ActivityLog.create({
        user_id: user.id,
        action: 'user_login',
        resource_type: 'User',
        resource_id: user.id,
        details: {
          device_info,
          login_method: 'email_password'
        },
        ip_address,
        user_agent
      });
      
      return {
        success: true,
        user: user.toSafeJSON(),
        tokens,
        message: 'Login realizado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Logout
  async logout(token, options = {}) {
    try {
      const { ip_address, user_agent } = options;
      
      // Decodificar token para obter sessão
      const decoded = jwt.verify(token, this.config.jwtSecret);
      const session = await this.db.UserSession.findByPk(decoded.sessionId);
      
      if (session) {
        // Invalidar sessão
        await session.invalidate();
        
        // Log de logout
        await this.db.ActivityLog.create({
          user_id: session.user_id,
          action: 'user_logout',
          resource_type: 'UserSession',
          resource_id: session.id,
          details: {
            session_duration: Date.now() - session.created_at.getTime()
          },
          ip_address,
          user_agent
        });
      }
      
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
      
    } catch (error) {
      console.error('Erro no logout:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, this.config.jwtSecret);
      
      const session = await this.db.UserSession.findOne({
        where: {
          id: decoded.sessionId,
          refresh_token: refreshToken,
          is_active: true
        },
        include: ['user']
      });
      
      if (!session || session.isExpired()) {
        throw new Error('Refresh token inválido ou expirado');
      }
      
      // Gerar novos tokens
      const tokens = await this.generateTokens(session.user, session.device_info);
      
      // Invalidar sessão antiga
      await session.invalidate();
      
      return {
        success: true,
        tokens,
        user: session.user.toSafeJSON()
      };
      
    } catch (error) {
      console.error('Erro no refresh token:', error);
      throw error;
    }
  }

  // Verificar token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret);
      
      const session = await this.db.UserSession.findOne({
        where: {
          id: decoded.sessionId,
          is_active: true
        },
        include: ['user']
      });
      
      if (!session || session.isExpired()) {
        throw new Error('Token inválido ou expirado');
      }
      
      return {
        valid: true,
        user: session.user.toSafeJSON(),
        session: session.toJSON()
      };
      
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Gerar tokens JWT
  async generateTokens(user, deviceInfo = {}) {
    // Criar sessão
    const session = await this.db.UserSession.create({
      user_id: user.id,
      device_info: deviceInfo,
      expires_at: new Date(Date.now() + this.parseTime(this.config.jwtExpiresIn))
    });
    
    // Payload do token
    const payload = {
      userId: user.id,
      sessionId: session.id,
      email: user.email,
      role: user.role?.name || 'user'
    };
    
    // Access token
    const accessToken = jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'nexus-framework',
      audience: 'nexus-app'
    });
    
    // Refresh token
    const refreshPayload = {
      sessionId: session.id,
      type: 'refresh'
    };
    
    const refreshToken = jwt.sign(refreshPayload, this.config.jwtSecret, {
      expiresIn: this.config.jwtRefreshExpiresIn,
      issuer: 'nexus-framework',
      audience: 'nexus-app'
    });
    
    // Atualizar sessão com tokens
    await session.update({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.parseTime(this.config.jwtExpiresIn),
      token_type: 'Bearer'
    };
  }

  // Validar senha
  validatePassword(password) {
    const errors = [];
    
    if (password.length < this.config.passwordMinLength) {
      errors.push(`Senha deve ter pelo menos ${this.config.passwordMinLength} caracteres`);
    }
    
    if (this.config.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }
    
    if (this.config.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }
    
    if (this.config.requireNumbers && !/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }
    
    if (this.config.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }
    
    if (errors.length > 0) {
      throw new Error(`Senha não atende aos critérios: ${errors.join(', ')}`);
    }
    
    return true;
  }

  // Log de tentativa de login falha
  async logFailedLogin(userId, email, reason, metadata = {}) {
    await this.db.ActivityLog.create({
      user_id: userId,
      action: 'login_failed',
      resource_type: 'User',
      resource_id: userId,
      details: {
        email,
        reason,
        ...metadata
      },
      ip_address: metadata.ip_address,
      user_agent: metadata.user_agent
    });
  }

  // Reset de senha
  async requestPasswordReset(email) {
    try {
      const user = await this.db.User.findOne({ where: { email: email.toLowerCase() } });
      
      if (!user) {
        // Não revelar se o email existe ou não por segurança
        return {
          success: true,
          message: 'Se o email existir, instruções de reset foram enviadas'
        };
      }
      
      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 3600000); // 1 hora
      
      await user.update({
        reset_password_token: resetToken,
        reset_password_expires: resetExpires
      });
      
      // Log da atividade
      await this.db.ActivityLog.create({
        user_id: user.id,
        action: 'password_reset_requested',
        resource_type: 'User',
        resource_id: user.id,
        details: { email }
      });

      // Enviar email com token de reset
      await this.sendPasswordResetEmail(user, resetToken);

      return {
        success: true,
        // Em produção, não retornar o token - apenas para desenvolvimento/testes
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
        message: 'Instruções de reset enviadas por email'
      };
      
    } catch (error) {
      console.error('Erro ao solicitar reset:', error);
      throw error;
    }
  }

  // Confirmar reset de senha
  async resetPassword(token, newPassword) {
    try {
      this.validatePassword(newPassword);
      
      const user = await this.db.User.findOne({
        where: {
          reset_password_token: token,
          reset_password_expires: { [this.db.sequelize.Op.gt]: new Date() }
        }
      });
      
      if (!user) {
        throw new Error('Token de reset inválido ou expirado');
      }
      
      // Atualizar senha
      await user.update({
        password_hash: newPassword, // Será hasheado no modelo
        reset_password_token: null,
        reset_password_expires: null,
        failed_login_attempts: 0,
        locked_until: null
      });
      
      // Invalidar todas as sessões do usuário
      await this.db.UserSession.update(
        { is_active: false },
        { where: { user_id: user.id } }
      );
      
      // Log da atividade
      await this.db.ActivityLog.create({
        user_id: user.id,
        action: 'password_reset_completed',
        resource_type: 'User',
        resource_id: user.id,
        details: { method: 'reset_token' }
      });
      
      return {
        success: true,
        message: 'Senha alterada com sucesso'
      };
      
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  }

  // Utilitários
  parseTime(timeString) {
    const units = {
      's': 1000,
      'm': 60000,
      'h': 3600000,
      'd': 86400000
    };

    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) return 86400000; // 1 dia padrão

    return parseInt(match[1]) * units[match[2]];
  }

  // Enviar email de reset de senha
  async sendPasswordResetEmail(user, resetToken) {
    try {
      // Importar módulo de notificações dinamicamente
      const { NotificationsModule } = await import('../notifications/index.js');
      const notifications = new NotificationsModule();

      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
      const appName = process.env.APP_NAME || 'Nexus';

      await notifications.sendEmail({
        to: user.email,
        template: 'password-reset',
        templateData: {
          userName: user.first_name || user.email.split('@')[0],
          appName,
          resetUrl
        }
      });

      console.log(`Email de reset de senha enviado para: ${user.email}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de reset:', error);
      // Não propagar erro - o reset token já foi salvo
      // O usuário pode solicitar reenvio se necessário
      return false;
    }
  }

  // Enviar email de boas-vindas
  async sendWelcomeEmail(user) {
    try {
      const { NotificationsModule } = await import('../notifications/index.js');
      const notifications = new NotificationsModule();

      const loginUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/login`;
      const appName = process.env.APP_NAME || 'Nexus';

      await notifications.sendEmail({
        to: user.email,
        template: 'welcome',
        templateData: {
          userName: user.first_name || user.email.split('@')[0],
          appName,
          loginUrl
        }
      });

      console.log(`Email de boas-vindas enviado para: ${user.email}`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email de boas-vindas:', error);
      return false;
    }
  }

  // Enviar código de verificação por SMS
  async sendVerificationCode(user, phone) {
    try {
      const { NotificationsModule } = await import('../notifications/index.js');
      const notifications = new NotificationsModule();

      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeExpires = new Date(Date.now() + 600000); // 10 minutos

      // Salvar código no usuário
      await user.update({
        verification_code: code,
        verification_code_expires: codeExpires
      });

      await notifications.sendSMS({
        to: phone,
        template: 'verification-code',
        templateData: { code }
      });

      console.log(`Código de verificação enviado para: ${phone}`);
      return { success: true, message: 'Código enviado com sucesso' };
    } catch (error) {
      console.error('Erro ao enviar código de verificação:', error);
      throw error;
    }
  }
}

// Singleton instance
let authInstance = null;

export async function initializeAuth(config = {}) {
  if (!authInstance) {
    authInstance = new AuthService(config);
    await authInstance.initialize();
  }
  return authInstance;
}

export async function getAuth() {
  if (!authInstance) {
    throw new Error('Auth service não foi inicializado. Chame initializeAuth() primeiro.');
  }
  return authInstance;
}

export default AuthService;