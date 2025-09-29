/**
 * Role Model - Sistema de Papéis/Funções
 * Framework Nexus - Oryum
 */

import { DataTypes } from 'sequelize';
import BaseModel from '../BaseModel.js';

class Role extends BaseModel {
  static init(sequelize) {
    return super.init({
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      
      // Identificação do papel
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Nome único do papel'
      },
      
      display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Nome amigável para exibição'
      },
      
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada do papel'
      },
      
      // Hierarquia
      level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Nível hierárquico (maior = mais poder)'
      },
      
      parent_role_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'roles',
          key: 'id'
        },
        comment: 'Papel pai (herança de permissões)'
      },
      
      // Configurações
      is_system: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se é um papel do sistema (não pode ser deletado)'
      },
      
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Se o papel está ativo'
      },
      
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Se é o papel padrão para novos usuários'
      },
      
      // Metadata
      color: {
        type: DataTypes.STRING(7),
        defaultValue: '#6B7280',
        comment: 'Cor hexadecimal para UI'
      },
      
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Ícone para representar o papel'
      },
      
      // Configurações especiais
      settings: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Configurações específicas do papel'
      },
      
      // Limites
      max_users: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Número máximo de usuários com este papel'
      }
      
    }, {
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
      indexes: [
        {
          fields: ['level'],
          name: 'roles_level_idx'
        },
        {
          fields: ['is_active'],
          name: 'roles_active_idx'
        },
        {
          fields: ['is_default'],
          name: 'roles_default_idx'
        },
        {
          fields: ['parent_role_id'],
          name: 'roles_parent_idx'
        }
      ]
    });
  }
  
  // Associações
  static associate(models) {
    // Auto-referência para hierarquia
    this.belongsTo(this, {
      foreignKey: 'parent_role_id',
      as: 'parent'
    });
    
    this.hasMany(this, {
      foreignKey: 'parent_role_id',
      as: 'children'
    });
    
    // Muitos-para-muitos com permissões
    this.belongsToMany(models.Permission, {
      through: 'role_permissions',
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions'
    });
    
    // Um-para-muitos com usuários
    this.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users'
    });
  }
  
  // Métodos estáticos
  static async createSystemRoles() {
    const systemRoles = [
      {
        name: 'super_admin',
        display_name: 'Super Administrador',
        description: 'Acesso completo ao sistema',
        level: 100,
        is_system: true,
        color: '#DC2626',
        icon: 'crown'
      },
      {
        name: 'admin',
        display_name: 'Administrador',
        description: 'Administrador do sistema',
        level: 90,
        is_system: true,
        color: '#EA580C',
        icon: 'shield'
      },
      {
        name: 'moderator',
        display_name: 'Moderador',
        description: 'Moderador de conteúdo',
        level: 70,
        is_system: true,
        color: '#D97706',
        icon: 'badge'
      },
      {
        name: 'editor',
        display_name: 'Editor',
        description: 'Editor de conteúdo',
        level: 50,
        is_system: true,
        color: '#059669',
        icon: 'edit'
      },
      {
        name: 'user',
        display_name: 'Usuário',
        description: 'Usuário padrão',
        level: 10,
        is_system: true,
        is_default: true,
        color: '#2563EB',
        icon: 'user'
      },
      {
        name: 'guest',
        display_name: 'Visitante',
        description: 'Acesso limitado',
        level: 0,
        is_system: true,
        color: '#6B7280',
        icon: 'eye'
      }
    ];
    
    for (const role of systemRoles) {
      await this.findOrCreate({
        where: { name: role.name },
        defaults: role
      });
    }
    
    return systemRoles.length;
  }
  
  static async getDefaultRole() {
    return await this.findOne({
      where: { is_default: true }
    });
  }
  
  static async getByLevel(minLevel = 0) {
    return await this.findAll({
      where: {
        level: { [this.sequelize.Op.gte]: minLevel },
        is_active: true
      },
      order: [['level', 'DESC']]
    });
  }
  
  static async getHierarchy() {
    return await this.findAll({
      where: { is_active: true },
      include: [
        {
          model: this,
          as: 'parent'
        },
        {
          model: this,
          as: 'children'
        }
      ],
      order: [['level', 'DESC']]
    });
  }
  
  // Métodos de instância
  async getFullPermissions() {
    const permissions = new Set();
    
    // Buscar permissões diretas
    const directPermissions = await this.getPermissions({
      where: { is_active: true }
    });
    
    directPermissions.forEach(perm => permissions.add(perm.name));
    
    // Buscar permissões herdadas do papel pai
    if (this.parent_role_id) {
      const parent = await this.constructor.findByPk(this.parent_role_id, {
        include: ['permissions']
      });
      
      if (parent) {
        const parentPermissions = await parent.getFullPermissions();
        parentPermissions.forEach(perm => permissions.add(perm));
      }
    }
    
    return Array.from(permissions);
  }
  
  async hasPermission(permissionName) {
    const permissions = await this.getFullPermissions();
    return permissions.includes(permissionName);
  }
  
  async addPermission(permission) {
    if (typeof permission === 'string') {
      const Permission = this.sequelize.models.Permission;
      permission = await Permission.findOne({ where: { name: permission } });
    }
    
    if (permission) {
      return await this.addPermissions(permission);
    }
    
    return false;
  }
  
  async removePermission(permission) {
    if (typeof permission === 'string') {
      const Permission = this.sequelize.models.Permission;
      permission = await Permission.findOne({ where: { name: permission } });
    }
    
    if (permission) {
      return await this.removePermissions(permission);
    }
    
    return false;
  }
  
  canModify(userRole) {
    // Super admin pode modificar qualquer papel
    if (userRole.name === 'super_admin') return true;
    
    // Admin pode modificar papéis de nível inferior
    if (userRole.name === 'admin' && this.level < userRole.level) return true;
    
    // Não pode modificar papéis do sistema (exceto super admin)
    if (this.is_system && userRole.name !== 'super_admin') return false;
    
    // Não pode modificar papel de nível igual ou superior
    return this.level < userRole.level;
  }
  
  async getUserCount() {
    return await this.countUsers();
  }
  
  async isAtMaxCapacity() {
    if (!this.max_users) return false;
    
    const count = await this.getUserCount();
    return count >= this.max_users;
  }
  
  // Formatação para API
  toPublicJSON() {
    return {
      id: this.id,
      name: this.name,
      display_name: this.display_name,
      description: this.description,
      level: this.level,
      color: this.color,
      icon: this.icon,
      is_active: this.is_active,
      created_at: this.created_at
    };
  }
  
  async toDetailedJSON() {
    const userCount = await this.getUserCount();
    const permissions = await this.getFullPermissions();
    
    return {
      ...this.toPublicJSON(),
      user_count: userCount,
      permissions_count: permissions.length,
      max_users: this.max_users,
      is_at_capacity: await this.isAtMaxCapacity(),
      settings: this.settings
    };
  }
}

export default Role;