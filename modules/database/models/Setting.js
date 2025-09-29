/**
 * Settings Model - Configurações do Sistema
 * Framework Nexus - Oryum
 */

import { DataTypes } from 'sequelize';
import BaseModel from '../BaseModel.js';

class Setting extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      // Identificação da configuração
      key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Chave única da configuração'
      },
      
      value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Valor da configuração (JSON string)'
      },
      
      default_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Valor padrão da configuração'
      },
      
      // Metadata
      type: {
        type: DataTypes.ENUM('string', 'number', 'boolean', 'json', 'array'),
        defaultValue: 'string',
        comment: 'Tipo do valor'
      },
      
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Categoria da configuração'
      },
      
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrição da configuração'
      },
      
      // Controle de acesso
      is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se a configuração é pública (visível na API)'
      },
      
      is_readonly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se a configuração é somente leitura'
      },
      
      is_encrypted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se o valor está criptografado'
      },
      
      // Validação
      validation_rules: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Regras de validação do valor'
      },
      
      // Escopo
      scope: {
        type: DataTypes.ENUM('global', 'user', 'group'),
        defaultValue: 'global',
        comment: 'Escopo da configuração'
      },
      
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'ID do usuário (para escopo user)'
      },
      
      group_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'ID do grupo (para escopo group)'
      }
      
    }, {
      sequelize,
      modelName: 'Setting',
      tableName: 'settings',
      indexes: [
        {
          fields: ['category'],
          name: 'settings_category_idx'
        },
        {
          fields: ['scope'],
          name: 'settings_scope_idx'
        },
        {
          fields: ['user_id'],
          name: 'settings_user_idx'
        },
        {
          fields: ['is_public'],
          name: 'settings_public_idx'
        }
      ]
    });
  }
  
  // Associações
  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }
  
  // Métodos estáticos
  static async createSystemSettings() {
    const systemSettings = [
      // Configurações gerais
      {
        key: 'app.name',
        value: 'Nexus Framework',
        type: 'string',
        category: 'general',
        description: 'Nome da aplicação',
        is_public: true
      },
      {
        key: 'app.version',
        value: '1.0.0',
        type: 'string',
        category: 'general',
        description: 'Versão da aplicação',
        is_public: true,
        is_readonly: true
      },
      {
        key: 'app.timezone',
        value: 'America/Sao_Paulo',
        type: 'string',
        category: 'general',
        description: 'Timezone da aplicação',
        is_public: true
      },
      {
        key: 'app.language',
        value: 'pt-BR',
        type: 'string',
        category: 'general',
        description: 'Idioma padrão',
        is_public: true
      },
      
      // Segurança
      {
        key: 'security.session_timeout',
        value: '86400',
        type: 'number',
        category: 'security',
        description: 'Timeout da sessão em segundos',
        validation_rules: { min: 300, max: 604800 }
      },
      {
        key: 'security.max_login_attempts',
        value: '5',
        type: 'number',
        category: 'security',
        description: 'Máximo de tentativas de login',
        validation_rules: { min: 3, max: 20 }
      },
      {
        key: 'security.password_min_length',
        value: '8',
        type: 'number',
        category: 'security',
        description: 'Tamanho mínimo da senha',
        validation_rules: { min: 6, max: 50 }
      },
      {
        key: 'security.require_2fa',
        value: 'false',
        type: 'boolean',
        category: 'security',
        description: 'Exigir autenticação 2FA'
      },
      
      // Email
      {
        key: 'email.from_address',
        value: 'noreply@nexus.dev',
        type: 'string',
        category: 'email',
        description: 'Email remetente padrão'
      },
      {
        key: 'email.smtp_enabled',
        value: 'false',
        type: 'boolean',
        category: 'email',
        description: 'Habilitar envio de email'
      },
      
      // API
      {
        key: 'api.rate_limit_requests',
        value: '100',
        type: 'number',
        category: 'api',
        description: 'Limite de requests por minuto',
        validation_rules: { min: 10, max: 10000 }
      },
      {
        key: 'api.cors_origins',
        value: '["*"]',
        type: 'array',
        category: 'api',
        description: 'Origens CORS permitidas'
      },
      
      // Banco de dados
      {
        key: 'database.backup_enabled',
        value: 'true',
        type: 'boolean',
        category: 'database',
        description: 'Habilitar backup automático'
      },
      {
        key: 'database.backup_interval',
        value: '86400',
        type: 'number',
        category: 'database',
        description: 'Intervalo de backup em segundos'
      },
      
      // Logs
      {
        key: 'logs.level',
        value: 'info',
        type: 'string',
        category: 'logs',
        description: 'Nível de log',
        validation_rules: { enum: ['debug', 'info', 'warn', 'error'] }
      },
      {
        key: 'logs.retention_days',
        value: '30',
        type: 'number',
        category: 'logs',
        description: 'Dias para manter logs'
      }
    ];
    
    for (const setting of systemSettings) {
      await this.findOrCreate({
        where: { key: setting.key },
        defaults: setting
      });
    }
    
    return systemSettings.length;
  }
  
  static async get(key, defaultValue = null, userId = null) {
    const setting = await this.findOne({
      where: {
        key,
        [this.sequelize.Op.or]: [
          { scope: 'global', user_id: null },
          { scope: 'user', user_id: userId }
        ]
      },
      order: [['scope', 'DESC']] // user settings override global
    });
    
    if (!setting) return defaultValue;
    
    return setting.getParsedValue();
  }
  
  static async set(key, value, userId = null) {
    const scope = userId ? 'user' : 'global';
    
    const [setting, created] = await this.findOrCreate({
      where: { key, scope, user_id: userId },
      defaults: {
        key,
        value: this.stringifyValue(value),
        scope,
        user_id: userId,
        category: 'custom'
      }
    });
    
    if (!created) {
      setting.value = this.stringifyValue(value);
      await setting.save();
    }
    
    return setting;
  }
  
  static async getByCategory(category, includePrivate = false) {
    const where = { category };
    
    if (!includePrivate) {
      where.is_public = true;
    }
    
    return await this.findAll({
      where,
      order: [['key', 'ASC']]
    });
  }
  
  static async getPublicSettings() {
    const settings = await this.findAll({
      where: {
        is_public: true,
        scope: 'global'
      },
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    
    const result = {};
    
    for (const setting of settings) {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }
      result[setting.category][setting.key] = setting.getParsedValue();
    }
    
    return result;
  }
  
  static stringifyValue(value) {
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  }
  
  // Métodos de instância
  getParsedValue() {
    if (!this.value) return this.getDefaultValue();
    
    try {
      switch (this.type) {
        case 'boolean':
          return this.value === 'true' || this.value === true;
        case 'number':
          return Number(this.value);
        case 'json':
        case 'array':
          return JSON.parse(this.value);
        default:
          return this.value;
      }
    } catch (error) {
      return this.getDefaultValue();
    }
  }
  
  getDefaultValue() {
    if (!this.default_value) return null;
    
    try {
      switch (this.type) {
        case 'boolean':
          return this.default_value === 'true';
        case 'number':
          return Number(this.default_value);
        case 'json':
        case 'array':
          return JSON.parse(this.default_value);
        default:
          return this.default_value;
      }
    } catch (error) {
      return null;
    }
  }
  
  async validateValue(value) {
    if (!this.validation_rules || Object.keys(this.validation_rules).length === 0) {
      return { valid: true };
    }
    
    const rules = this.validation_rules;
    const errors = [];
    
    // Validação de tipo
    switch (this.type) {
      case 'number':
        if (isNaN(value)) {
          errors.push('Valor deve ser um número');
        } else {
          const num = Number(value);
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`Valor deve ser maior que ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`Valor deve ser menor que ${rules.max}`);
          }
        }
        break;
        
      case 'string':
        if (rules.min_length && value.length < rules.min_length) {
          errors.push(`Deve ter pelo menos ${rules.min_length} caracteres`);
        }
        if (rules.max_length && value.length > rules.max_length) {
          errors.push(`Deve ter no máximo ${rules.max_length} caracteres`);
        }
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push('Formato inválido');
        }
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Deve ser um dos valores: ${rules.enum.join(', ')}`);
        }
        break;
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  async setValue(value) {
    const validation = await this.validateValue(value);
    
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }
    
    this.value = this.constructor.stringifyValue(value);
    return await this.save();
  }
  
  // Formatação para API
  toPublicJSON() {
    return {
      key: this.key,
      value: this.getParsedValue(),
      type: this.type,
      category: this.category,
      description: this.description
    };
  }
  
  toAdminJSON() {
    return {
      ...this.toPublicJSON(),
      id: this.id,
      default_value: this.getDefaultValue(),
      is_public: this.is_public,
      is_readonly: this.is_readonly,
      is_encrypted: this.is_encrypted,
      scope: this.scope,
      validation_rules: this.validation_rules,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}

export default Setting;