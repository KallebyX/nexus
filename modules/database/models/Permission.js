/**
 * Permission Model - Sistema de Permissões Granulares
 * Framework Nexus - Oryum
 */

import { DataTypes } from 'sequelize';
import BaseModel from '../BaseModel.js';

class Permission extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      // Identificação da permissão
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Nome único da permissão'
      },
      
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada da permissão'
      },
      
      // Hierarquia de permissões
      resource: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Recurso que a permissão controla (users, posts, etc)'
      },
      
      action: {
        type: DataTypes.ENUM('create', 'read', 'update', 'delete', 'admin'),
        allowNull: false,
        comment: 'Ação permitida no recurso'
      },
      
      // Controle de escopo
      scope: {
        type: DataTypes.ENUM('own', 'group', 'all'),
        defaultValue: 'own',
        comment: 'Escopo da permissão: próprios dados, grupo ou todos'
      },
      
      // Condições especiais
      conditions: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Condições especiais para aplicar a permissão'
      },
      
      // Status
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Se a permissão está ativa'
      },
      
      // Metadata
      category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Categoria da permissão para organização'
      },
      
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Prioridade da permissão (maior = mais importante)'
      }
      
    }, {
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      indexes: [
        {
          fields: ['resource', 'action'],
          name: 'permissions_resource_action_idx'
        },
        {
          fields: ['category'],
          name: 'permissions_category_idx'
        },
        {
          fields: ['is_active'],
          name: 'permissions_active_idx'
        }
      ]
    });
  }
  
  // Associações
  static associate(models) {
    // Muitos-para-muitos com roles
    this.belongsToMany(models.Role, {
      through: 'role_permissions',
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles'
    });
    
    // Muitos-para-muitos com usuários (permissões diretas)
    this.belongsToMany(models.User, {
      through: 'user_permissions',
      foreignKey: 'permission_id',
      otherKey: 'user_id',
      as: 'users'
    });
  }
  
  // Métodos estáticos
  static async createSystemPermissions() {
    const systemPermissions = [
      // Usuários
      { name: 'users.create', resource: 'users', action: 'create', description: 'Criar novos usuários', category: 'users' },
      { name: 'users.read.own', resource: 'users', action: 'read', scope: 'own', description: 'Ver próprio perfil', category: 'users' },
      { name: 'users.read.all', resource: 'users', action: 'read', scope: 'all', description: 'Ver todos os usuários', category: 'users' },
      { name: 'users.update.own', resource: 'users', action: 'update', scope: 'own', description: 'Editar próprio perfil', category: 'users' },
      { name: 'users.update.all', resource: 'users', action: 'update', scope: 'all', description: 'Editar qualquer usuário', category: 'users' },
      { name: 'users.delete', resource: 'users', action: 'delete', description: 'Deletar usuários', category: 'users' },
      { name: 'users.admin', resource: 'users', action: 'admin', description: 'Administração completa de usuários', category: 'users' },
      
      // Sistema
      { name: 'system.settings', resource: 'system', action: 'admin', description: 'Configurações do sistema', category: 'system' },
      { name: 'system.logs', resource: 'system', action: 'read', description: 'Visualizar logs do sistema', category: 'system' },
      { name: 'system.backup', resource: 'system', action: 'admin', description: 'Gerenciar backups', category: 'system' },
      
      // API
      { name: 'api.access', resource: 'api', action: 'read', description: 'Acesso à API', category: 'api' },
      { name: 'api.admin', resource: 'api', action: 'admin', description: 'Administração da API', category: 'api' }
    ];
    
    for (const perm of systemPermissions) {
      await this.findOrCreate({
        where: { name: perm.name },
        defaults: perm
      });
    }
    
    return systemPermissions.length;
  }
  
  static async getByResource(resource) {
    return await this.findAll({
      where: { 
        resource,
        is_active: true 
      },
      order: [['priority', 'DESC'], ['name', 'ASC']]
    });
  }
  
  static async getByCategory(category) {
    return await this.findAll({
      where: { 
        category,
        is_active: true 
      },
      order: [['priority', 'DESC'], ['name', 'ASC']]
    });
  }
  
  // Métodos de instância
  canExecute(user, target = null) {
    if (!this.is_active) return false;
    
    // Verificar condições especiais
    if (this.conditions && Object.keys(this.conditions).length > 0) {
      // Implementar lógica de condições
      for (const [key, value] of Object.entries(this.conditions)) {
        if (!this.checkCondition(key, value, user, target)) {
          return false;
        }
      }
    }
    
    // Verificar escopo
    if (this.scope === 'own' && target && target.user_id !== user.id) {
      return false;
    }
    
    return true;
  }
  
  checkCondition(key, value, user, target) {
    switch (key) {
      case 'user_status':
        return user.status === value;
      case 'user_role':
        return user.role === value;
      case 'time_range':
        const now = new Date();
        const start = new Date(value.start);
        const end = new Date(value.end);
        return now >= start && now <= end;
      default:
        return true;
    }
  }
  
  // Formatação para API
  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      resource: this.resource,
      action: this.action,
      scope: this.scope,
      category: this.category,
      is_active: this.is_active
    };
  }
}

export default Permission;