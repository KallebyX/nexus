/**
 * Módulo de Autenticação - Oryum Nexus
 * Sistema completo de autenticação com JWT, OAuth e roles
 */

import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

export class AuthModule {
  constructor(config = {}) {
    this.config = {
      provider: 'supabase',
      socialLogin: ['google', 'github'],
      jwt: true,
      roles: ['admin', 'user'],
      ...config
    };

    this.initializeProvider();
  }

  initializeProvider() {
    if (this.config.provider === 'supabase') {
      this.supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY
      );
    }
  }

  /**
   * Middleware para Express.js
   * Aplica autenticação automática nas rotas
   */
  middleware() {
    return (req, res, next) => {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
      }
    };
  }

  /**
   * Login com email e senha
   */
  async login(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const token = jwt.sign(
        { 
          id: data.user.id, 
          email: data.user.email,
          role: data.user.user_metadata?.role || 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token,
        user: data.user,
        expiresIn: '24h'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Registro de novo usuário
   */
  async register(email, password, userData = {}) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user',
            ...userData
          }
        }
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        message: 'Usuário criado com sucesso'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login social (Google, GitHub)
   */
  async socialLogin(provider) {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: process.env.AUTH_REDIRECT_URL
        }
      });

      if (error) throw error;

      return {
        success: true,
        url: data.url
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar permissões do usuário
   */
  hasPermission(user, permission) {
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage'],
      user: ['read', 'write']
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  }

  /**
   * Middleware de autorização por role
   */
  requireRole(role) {
    return (req, res, next) => {
      if (!req.user || req.user.role !== role) {
        return res.status(403).json({ 
          error: 'Acesso negado: permissão insuficiente' 
        });
      }
      next();
    };
  }

  /**
   * Logout e invalidação de token
   */
  async logout() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error) throw error;

      const newToken = jwt.sign(
        {
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata?.role || 'user'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return {
        success: true,
        token: newToken,
        user: data.user
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default AuthModule;