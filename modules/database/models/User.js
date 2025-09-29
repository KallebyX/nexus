/**
 * User Model - Nexus Framework
 * Modelo de usuário com autenticação e perfis
 */

import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import { BaseModel } from '../BaseModel.js';

export class User extends BaseModel {
  static init(sequelize) {
    super.init({
      // Informações básicas
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          len: [1, 255]
        }
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
          len: [3, 50],
          isAlphanumeric: true
        }
      },
      password_hash: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [60, 60] // bcrypt hash length
        }
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
          notEmpty: true
        }
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100],
          notEmpty: true
        }
      },
      
      // Contato
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          is: /^[\+]?[\d\s\-\(\)]+$/
        }
      },
      avatar_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isUrl: true
        }
      },
      
      // Status e configurações
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'pending', 'suspended'),
        allowNull: false,
        defaultValue: 'pending'
      },
      role: {
        type: DataTypes.ENUM('admin', 'moderator', 'user', 'guest'),
        allowNull: false,
        defaultValue: 'user'
      },
      
      // Verificações
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      phone_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      phone_verified_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      // Segurança
      two_factor_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      two_factor_secret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      password_reset_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      email_verification_token: {
        type: DataTypes.STRING,
        allowNull: true
      },
      failed_login_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      locked_until: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      // Datas importantes
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      last_login_ip: {
        type: DataTypes.INET,
        allowNull: true
      },
      password_changed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      
      // Localização e timezone
      timezone: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'America/Sao_Paulo'
      },
      locale: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pt-BR'
      },
      
      // Preferências
      preferences: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          theme: 'system',
          notifications: {
            email: true,
            push: true,
            sms: false
          },
          privacy: {
            showEmail: false,
            showPhone: false,
            indexProfile: true
          }
        }
      },
      
      // Informações extras
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 500]
        }
      },
      website: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isUrl: true
        }
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [0, 100]
        }
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
      },
      
      // Marketing e termos
      marketing_consent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      marketing_consent_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      terms_accepted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      privacy_policy_accepted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          if (user.password_hash) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password_hash')) {
            user.password_hash = await bcrypt.hash(user.password_hash, 12);
            user.password_changed_at = new Date();
          }
        }
      },
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['username'], unique: true },
        { fields: ['status'] },
        { fields: ['role'] },
        { fields: ['email_verified'] },
        { fields: ['created_at'] },
        { fields: ['last_login_at'] }
      ]
    });

    return this;
  }

  // Métodos de instância
  async validatePassword(password) {
    return bcrypt.compare(password, this.password_hash);
  }

  async updatePassword(newPassword) {
    this.password_hash = newPassword; // Será hasheado pelo hook
    this.password_changed_at = new Date();
    await this.save();
  }

  getFullName() {
    return `${this.first_name} ${this.last_name}`.trim();
  }

  getPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: this.getFullName(),
      avatar_url: this.avatar_url,
      bio: this.bio,
      website: this.website,
      location: this.preferences.privacy.showEmail ? this.location : null,
      created_at: this.created_at
    };
  }

  toPublicJSON() {
    const json = super.toPublicJSON();
    
    // Remover campos sensíveis
    delete json.password_hash;
    delete json.two_factor_secret;
    delete json.password_reset_token;
    delete json.email_verification_token;
    delete json.failed_login_attempts;
    delete json.locked_until;
    delete json.last_login_ip;
    
    // Filtrar email/phone baseado em preferências de privacidade
    if (!this.preferences.privacy.showEmail) {
      delete json.email;
    }
    if (!this.preferences.privacy.showPhone) {
      delete json.phone;
    }

    return json;
  }

  async recordLogin(ipAddress) {
    this.last_login_at = new Date();
    this.last_login_ip = ipAddress;
    this.failed_login_attempts = 0;
    this.locked_until = null;
    await this.save();
  }

  async recordFailedLogin() {
    this.failed_login_attempts += 1;
    
    // Bloquear após 5 tentativas por 15 minutos
    if (this.failed_login_attempts >= 5) {
      this.locked_until = new Date(Date.now() + 15 * 60 * 1000);
    }
    
    await this.save();
  }

  isLocked() {
    return this.locked_until && new Date() < this.locked_until;
  }

  async unlock() {
    this.failed_login_attempts = 0;
    this.locked_until = null;
    await this.save();
  }

  async verifyEmail() {
    this.email_verified = true;
    this.email_verified_at = new Date();
    this.email_verification_token = null;
    this.status = this.status === 'pending' ? 'active' : this.status;
    await this.save();
  }

  async verifyPhone() {
    this.phone_verified = true;
    this.phone_verified_at = new Date();
    await this.save();
  }

  canAccess(resource, action = 'read') {
    const permissions = {
      admin: ['*'],
      moderator: ['users:read', 'users:update', 'content:*'],
      user: ['profile:*', 'content:read'],
      guest: ['content:read']
    };

    const userPermissions = permissions[this.role] || [];
    
    if (userPermissions.includes('*')) return true;
    if (userPermissions.includes(`${resource}:*`)) return true;
    if (userPermissions.includes(`${resource}:${action}`)) return true;
    
    return false;
  }

  // Métodos estáticos
  static async findByEmail(email) {
    return this.findOne({ where: { email: email.toLowerCase() } });
  }

  static async findByUsername(username) {
    return this.findOne({ where: { username } });
  }

  static async findByEmailOrUsername(identifier) {
    const { Op } = await import('sequelize');
    return this.findOne({
      where: {
        [Op.or]: [
          { email: identifier.toLowerCase() },
          { username: identifier }
        ]
      }
    });
  }

  static async createUser(userData) {
    const user = await this.create({
      ...userData,
      email: userData.email.toLowerCase()
    });

    // Remover dados sensíveis do retorno
    return user.toPublicJSON();
  }

  static async getActiveUsers(limit = 10) {
    return this.findAll({
      where: { 
        status: 'active',
        email_verified: true
      },
      order: [['last_login_at', 'DESC']],
      limit,
      attributes: { exclude: ['password_hash', 'two_factor_secret'] }
    });
  }

  static async getUserStats() {
    const { Op } = await import('sequelize');
    
    const baseStats = await super.getStats();
    
    const verified = await this.count({
      where: { email_verified: true }
    });
    
    const active = await this.count({
      where: { status: 'active' }
    });
    
    const loggedInLastWeek = await this.count({
      where: {
        last_login_at: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return {
      ...baseStats,
      verified,
      active,
      loggedInLastWeek,
      verificationRate: baseStats.total > 0 ? Math.round((verified / baseStats.total) * 100) : 0,
      activeRate: baseStats.total > 0 ? Math.round((active / baseStats.total) * 100) : 0
    };
  }

  // Associações
  static associate(models) {
    // Um usuário pode ter muitas sessões
    this.hasMany(models.UserSession, {
      foreignKey: 'user_id',
      as: 'sessions'
    });

    // Um usuário pode ter muitos logs de atividade
    this.hasMany(models.ActivityLog, {
      foreignKey: 'user_id',
      as: 'activities'
    });

    // Um usuário pode ter muitas permissões
    this.belongsToMany(models.Permission, {
      through: 'user_permissions',
      foreignKey: 'user_id',
      otherKey: 'permission_id',
      as: 'permissions'
    });

    // Um usuário pode pertencer a muitos grupos
    this.belongsToMany(models.Group, {
      through: 'user_groups',
      foreignKey: 'user_id',
      otherKey: 'group_id',
      as: 'groups'
    });
  }
}

export default User;