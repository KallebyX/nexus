/**
 * ActivityLog Model - Nexus Framework
 * Modelo para auditoria e logs de atividade do sistema
 */

import { DataTypes } from 'sequelize';
import { BaseModel } from '../BaseModel.js';

export class ActivityLog extends BaseModel {
  static init(sequelize) {
    super.init({
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'user_sessions',
          key: 'id'
        }
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 100]
        }
      },
      resource_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 50]
        }
      },
      resource_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      severity: {
        type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'low'
      },
      status: {
        type: DataTypes.ENUM('success', 'failure', 'warning', 'info'),
        allowNull: false,
        defaultValue: 'success'
      },
      ip_address: {
        type: DataTypes.INET,
        allowNull: true
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      request_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      duration_ms: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0
        }
      },
      old_values: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      },
      new_values: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null
      },
      context: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      tags: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: []
      },
      correlation_id: {
        type: DataTypes.STRING,
        allowNull: true
      },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'activity_logs',
          key: 'id'
        }
      }
    }, {
      sequelize,
      modelName: 'ActivityLog',
      tableName: 'activity_logs',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['session_id'] },
        { fields: ['action'] },
        { fields: ['resource_type'] },
        { fields: ['resource_id'] },
        { fields: ['severity'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
        { fields: ['ip_address'] },
        { fields: ['request_id'] },
        { fields: ['correlation_id'] },
        { fields: ['parent_id'] },
        { fields: ['tags'], using: 'gin' },
        { fields: ['context'], using: 'gin' }
      ]
    });

    return this;
  }

  // Métodos de instância
  getFormattedMessage() {
    const timestamp = this.created_at.toISOString();
    const user = this.user_id ? `User:${this.user_id}` : 'System';
    return `[${timestamp}] ${user} ${this.action} ${this.resource_type}${this.resource_id ? ':' + this.resource_id : ''} - ${this.description || 'No description'}`;
  }

  isSecurityEvent() {
    const securityActions = [
      'login', 'logout', 'failed_login', 'password_change', 
      'permission_change', 'role_change', '2fa_enable', 
      '2fa_disable', 'account_lock', 'account_unlock'
    ];
    return securityActions.includes(this.action) || this.severity === 'critical';
  }

  getAuditTrail() {
    return {
      id: this.id,
      timestamp: this.created_at,
      user_id: this.user_id,
      action: this.action,
      resource: `${this.resource_type}${this.resource_id ? ':' + this.resource_id : ''}`,
      status: this.status,
      ip_address: this.ip_address,
      changes: this.getChanges()
    };
  }

  getChanges() {
    if (!this.old_values && !this.new_values) return null;
    
    return {
      before: this.old_values,
      after: this.new_values,
      fields_changed: this.getChangedFields()
    };
  }

  getChangedFields() {
    if (!this.old_values || !this.new_values) return [];
    
    const oldKeys = Object.keys(this.old_values);
    const newKeys = Object.keys(this.new_values);
    const allKeys = [...new Set([...oldKeys, ...newKeys])];
    
    return allKeys.filter(key => {
      const oldVal = this.old_values[key];
      const newVal = this.new_values[key];
      return JSON.stringify(oldVal) !== JSON.stringify(newVal);
    });
  }

  // Métodos estáticos
  static async logActivity(data) {
    const {
      userId,
      sessionId,
      action,
      resourceType,
      resourceId,
      description,
      severity = 'low',
      status = 'success',
      ipAddress,
      userAgent,
      requestId,
      duration,
      oldValues,
      newValues,
      context = {},
      tags = [],
      correlationId,
      parentId
    } = data;

    return this.create({
      user_id: userId,
      session_id: sessionId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      severity,
      status,
      ip_address: ipAddress,
      user_agent: userAgent,
      request_id: requestId,
      duration_ms: duration,
      old_values: oldValues,
      new_values: newValues,
      context,
      tags,
      correlation_id: correlationId,
      parent_id: parentId
    });
  }

  static async logUserAction(userId, action, resourceType, resourceId, options = {}) {
    return this.logActivity({
      userId,
      action,
      resourceType,
      resourceId,
      ...options
    });
  }

  static async logSystemEvent(action, resourceType, description, options = {}) {
    return this.logActivity({
      action,
      resourceType,
      description,
      severity: 'medium',
      ...options
    });
  }

  static async logSecurityEvent(action, userId, ipAddress, options = {}) {
    return this.logActivity({
      userId,
      action,
      resourceType: 'security',
      severity: 'high',
      ipAddress,
      tags: ['security', ...options.tags || []],
      ...options
    });
  }

  static async logError(error, context = {}) {
    return this.logActivity({
      action: 'error',
      resourceType: 'system',
      description: error.message,
      severity: 'high',
      status: 'failure',
      context: {
        error_stack: error.stack,
        error_name: error.name,
        ...context
      },
      tags: ['error']
    });
  }

  static async getActivityHistory(filters = {}) {
    const {
      userId,
      action,
      resourceType,
      severity,
      status,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters;

    const { Op } = await import('sequelize');
    const where = {};

    if (userId) where.user_id = userId;
    if (action) where.action = action;
    if (resourceType) where.resource_type = resourceType;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    return this.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });
  }

  static async getSecurityEvents(timeframe = '24h') {
    const { Op } = await import('sequelize');
    
    const timeframes = {
      '1h': 1 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(Date.now() - (timeframes[timeframe] || timeframes['24h']));

    return this.findAll({
      where: {
        created_at: { [Op.gte]: startTime },
        [Op.or]: [
          { severity: { [Op.in]: ['high', 'critical'] } },
          { tags: { [Op.contains]: ['security'] } }
        ]
      },
      order: [['created_at', 'DESC']],
      include: [{
        model: this.sequelize.models.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }]
    });
  }

  static async getActivityStats(userId = null, timeframe = '7d') {
    const { Op } = await import('sequelize');
    
    const timeframes = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const startTime = new Date(Date.now() - (timeframes[timeframe] || timeframes['7d']));
    const baseWhere = {
      created_at: { [Op.gte]: startTime }
    };

    if (userId) baseWhere.user_id = userId;

    // Contagem total
    const total = await this.count({ where: baseWhere });

    // Por status
    const byStatus = await this.findAll({
      where: baseWhere,
      attributes: [
        'status',
        [this.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Por severidade
    const bySeverity = await this.findAll({
      where: baseWhere,
      attributes: [
        'severity',
        [this.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['severity'],
      raw: true
    });

    // Por ação (top 10)
    const byAction = await this.findAll({
      where: baseWhere,
      attributes: [
        'action',
        [this.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['action'],
      order: [[this.sequelize.fn('COUNT', '*'), 'DESC']],
      limit: 10,
      raw: true
    });

    // Atividade por dia
    const dailyActivity = await this.findAll({
      where: baseWhere,
      attributes: [
        [this.sequelize.fn('DATE', this.sequelize.col('created_at')), 'date'],
        [this.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: [this.sequelize.fn('DATE', this.sequelize.col('created_at'))],
      order: [[this.sequelize.fn('DATE', this.sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = parseInt(item.count);
        return acc;
      }, {}),
      topActions: byAction.map(item => ({
        action: item.action,
        count: parseInt(item.count)
      })),
      dailyActivity: dailyActivity.map(item => ({
        date: item.date,
        count: parseInt(item.count)
      }))
    };
  }

  static async cleanupOldLogs(retentionDays = 90) {
    const { Op } = await import('sequelize');
    
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    
    const deleted = await this.destroy({
      where: {
        created_at: { [Op.lt]: cutoffDate },
        severity: { [Op.notIn]: ['critical'] } // Manter logs críticos
      },
      force: true
    });

    return { deleted, cutoffDate };
  }

  // Associações
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    this.belongsTo(models.UserSession, {
      foreignKey: 'session_id',
      as: 'session'
    });

    this.belongsTo(models.ActivityLog, {
      foreignKey: 'parent_id',
      as: 'parent'
    });

    this.hasMany(models.ActivityLog, {
      foreignKey: 'parent_id',
      as: 'children'
    });
  }
}

export default ActivityLog;