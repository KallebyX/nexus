/**
 * UserSession Model - Nexus Framework
 * Modelo para gerenciar sessões de usuário e tokens JWT
 */

import { DataTypes } from 'sequelize';
import crypto from 'crypto';
import { BaseModel } from '../BaseModel.js';

export class UserSession extends BaseModel {
  static init(sequelize) {
    super.init({
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      token_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      refresh_token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      device_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      device_name: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          len: [0, 100]
        }
      },
      device_type: {
        type: DataTypes.ENUM('web', 'mobile', 'desktop', 'tablet', 'api'),
        allowNull: false,
        defaultValue: 'web'
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      browser: {
        type: DataTypes.STRING,
        allowNull: true
      },
      os: {
        type: DataTypes.STRING,
        allowNull: true
      },
      location: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      last_used_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      revoked_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      revoked_reason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      scopes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: ['read', 'write']
      },
      remember_me: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      sequelize,
      modelName: 'UserSession',
      tableName: 'user_sessions',
      hooks: {
        beforeCreate: (session) => {
          if (!session.token_id) {
            session.token_id = crypto.randomBytes(32).toString('hex');
          }
          if (!session.refresh_token) {
            session.refresh_token = crypto.randomBytes(64).toString('hex');
          }
        }
      },
      indexes: [
        { fields: ['user_id'] },
        { fields: ['token_id'], unique: true },
        { fields: ['refresh_token'], unique: true },
        { fields: ['device_id'] },
        { fields: ['is_active'] },
        { fields: ['expires_at'] },
        { fields: ['last_used_at'] },
        { fields: ['ip_address'] }
      ]
    });

    return this;
  }

  // Métodos de instância
  isExpired() {
    return new Date() > this.expires_at;
  }

  isValid() {
    return this.is_active && !this.isExpired() && !this.revoked_at;
  }

  async updateLastUsed() {
    this.last_used_at = new Date();
    await this.save();
  }

  async revoke(reason = 'manual') {
    this.is_active = false;
    this.revoked_at = new Date();
    this.revoked_reason = reason;
    await this.save();
  }

  async extend(additionalMinutes = 60) {
    if (this.remember_me) {
      // Remember me sessions duram 30 dias
      this.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Sessões normais duram algumas horas
      this.expires_at = new Date(Date.now() + additionalMinutes * 60 * 1000);
    }
    await this.save();
  }

  getDeviceInfo() {
    return {
      id: this.device_id,
      name: this.device_name,
      type: this.device_type,
      browser: this.browser,
      os: this.os,
      ip_address: this.ip_address,
      location: this.location
    };
  }

  toSafeJSON() {
    const json = this.toJSON();
    delete json.refresh_token;
    delete json.token_id;
    return json;
  }

  // Métodos estáticos
  static async createSession(userId, sessionData = {}) {
    const {
      deviceId,
      deviceName,
      deviceType = 'web',
      ipAddress,
      userAgent,
      browser,
      os,
      location,
      rememberMe = false,
      scopes = ['read', 'write']
    } = sessionData;

    // Calcular expiração
    const expirationTime = rememberMe 
      ? 30 * 24 * 60 * 60 * 1000  // 30 dias
      : 24 * 60 * 60 * 1000;      // 24 horas

    const session = await this.create({
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
      device_type: deviceType,
      ip_address: ipAddress,
      user_agent: userAgent,
      browser,
      os,
      location,
      expires_at: new Date(Date.now() + expirationTime),
      remember_me: rememberMe,
      scopes
    });

    return session;
  }

  static async findValidSession(tokenId) {
    const session = await this.findOne({
      where: { token_id: tokenId },
      include: [{
        model: this.sequelize.models.User,
        as: 'user',
        attributes: { exclude: ['password_hash', 'two_factor_secret'] }
      }]
    });

    if (!session || !session.isValid()) {
      return null;
    }

    return session;
  }

  static async refreshSession(refreshToken) {
    const session = await this.findOne({
      where: { 
        refresh_token: refreshToken,
        is_active: true
      }
    });

    if (!session || session.isExpired()) {
      return null;
    }

    // Gerar novos tokens
    session.token_id = crypto.randomBytes(32).toString('hex');
    session.refresh_token = crypto.randomBytes(64).toString('hex');
    
    // Estender expiração
    await session.extend();
    await session.save();

    return session;
  }

  static async revokeUserSessions(userId, keepCurrentSession = null) {
    const whereClause = { 
      user_id: userId,
      is_active: true
    };

    if (keepCurrentSession) {
      whereClause.id = { [this.sequelize.Sequelize.Op.ne]: keepCurrentSession };
    }

    await this.update(
      {
        is_active: false,
        revoked_at: new Date(),
        revoked_reason: 'bulk_revocation'
      },
      { where: whereClause }
    );
  }

  static async cleanupExpiredSessions() {
    const { Op } = await import('sequelize');
    
    const expired = await this.update(
      {
        is_active: false,
        revoked_at: new Date(),
        revoked_reason: 'expired'
      },
      {
        where: {
          expires_at: { [Op.lt]: new Date() },
          is_active: true
        }
      }
    );

    // Deletar sessões muito antigas (mais de 90 dias)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const deleted = await this.destroy({
      where: {
        revoked_at: { [Op.lt]: ninetyDaysAgo }
      },
      force: true
    });

    return { expired: expired[0], deleted };
  }

  static async getUserActiveSessions(userId, excludeSessionId = null) {
    const { Op } = await import('sequelize');
    
    const whereClause = {
      user_id: userId,
      is_active: true,
      expires_at: { [Op.gt]: new Date() }
    };

    if (excludeSessionId) {
      whereClause.id = { [Op.ne]: excludeSessionId };
    }

    return this.findAll({
      where: whereClause,
      order: [['last_used_at', 'DESC']],
      attributes: { exclude: ['refresh_token', 'token_id'] }
    });
  }

  static async getSessionStats(userId = null) {
    const { Op } = await import('sequelize');
    
    const baseWhere = userId ? { user_id: userId } : {};
    
    const total = await this.count({ where: baseWhere });
    
    const active = await this.count({
      where: {
        ...baseWhere,
        is_active: true,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    const expired = await this.count({
      where: {
        ...baseWhere,
        expires_at: { [Op.lt]: new Date() }
      }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const createdToday = await this.count({
      where: {
        ...baseWhere,
        created_at: { [Op.gte]: today }
      }
    });

    // Estatísticas por tipo de dispositivo
    const deviceStats = await this.findAll({
      where: {
        ...baseWhere,
        is_active: true
      },
      attributes: [
        'device_type',
        [this.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['device_type'],
      raw: true
    });

    return {
      total,
      active,
      expired,
      createdToday,
      deviceBreakdown: deviceStats.reduce((acc, stat) => {
        acc[stat.device_type] = parseInt(stat.count);
        return acc;
      }, {})
    };
  }

  // Associações
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
}

export default UserSession;