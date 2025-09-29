/**
 * Base Model - Nexus Framework
 * Modelo base com campos padrão e métodos comuns
 */

import { DataTypes, Model } from 'sequelize';

export class BaseModel extends Model {
  static init(attributes, options = {}) {
    // Campos padrão para todos os modelos
    const baseAttributes = {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    };

    // Mesclar atributos customizados com base
    const mergedAttributes = {
      ...baseAttributes,
      ...attributes
    };

    // Opções padrão
    const baseOptions = {
      timestamps: true,
      paranoid: true,
      underscored: true,
      freezeTableName: true,
      version: true,
      hooks: {
        beforeUpdate: (instance) => {
          instance.version = instance.version + 1;
        }
      },
      ...options
    };

    return super.init(mergedAttributes, baseOptions);
  }

  // Métodos de instância comuns
  toPublicJSON() {
    const json = this.toJSON();
    
    // Remover campos sensíveis
    delete json.deleted_at;
    delete json.version;
    
    return json;
  }

  // Soft delete customizado
  async softDelete(userId = null) {
    this.deleted_at = new Date();
    this.updated_by = userId;
    await this.save({ paranoid: false });
  }

  // Restaurar soft delete
  async restore(userId = null) {
    this.deleted_at = null;
    this.updated_by = userId;
    await this.save({ paranoid: false });
  }

  // Audit trail
  getAuditTrail() {
    return {
      id: this.id,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
      version: this.version,
      is_deleted: !!this.deleted_at
    };
  }

  // Métodos estáticos de classe
  static async findByIdOrFail(id) {
    const instance = await this.findByPk(id);
    if (!instance) {
      throw new Error(`${this.name} with id ${id} not found`);
    }
    return instance;
  }

  static async findActiveOnly(options = {}) {
    return this.findAll({
      ...options,
      where: {
        deleted_at: null,
        ...options.where
      }
    });
  }

  static async createWithUser(data, userId) {
    return this.create({
      ...data,
      created_by: userId,
      updated_by: userId
    });
  }

  static async updateWithUser(id, data, userId) {
    const [updatedRowsCount] = await this.update(
      {
        ...data,
        updated_by: userId
      },
      {
        where: { id },
        returning: true
      }
    );

    if (updatedRowsCount === 0) {
      throw new Error(`${this.name} with id ${id} not found`);
    }

    return this.findByPk(id);
  }

  static async bulkCreateWithUser(dataArray, userId) {
    const enrichedData = dataArray.map(data => ({
      ...data,
      created_by: userId,
      updated_by: userId
    }));

    return this.bulkCreate(enrichedData, { returning: true });
  }

  // Paginação padrão
  static async paginate(options = {}) {
    const {
      page = 1,
      limit = 20,
      order = [['created_at', 'DESC']],
      where = {},
      include = [],
      attributes
    } = options;

    const offset = (page - 1) * limit;

    const { count, rows } = await this.findAndCountAll({
      where,
      include,
      attributes,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    };
  }

  // Busca com filtros
  static async search(searchTerm, searchFields = [], options = {}) {
    if (!searchTerm || searchFields.length === 0) {
      return this.findAll(options);
    }

    const { Op } = await import('sequelize');
    
    const searchConditions = searchFields.map(field => ({
      [field]: {
        [Op.iLike]: `%${searchTerm}%`
      }
    }));

    return this.findAll({
      ...options,
      where: {
        [Op.or]: searchConditions,
        ...options.where
      }
    });
  }

  // Estatísticas básicas
  static async getStats() {
    const { Op } = await import('sequelize');
    
    const total = await this.count();
    const active = await this.count({
      where: { deleted_at: null }
    });
    const deleted = await this.count({
      where: { deleted_at: { [Op.not]: null } }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const createdToday = await this.count({
      where: {
        created_at: { [Op.gte]: today }
      }
    });

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const createdLastWeek = await this.count({
      where: {
        created_at: { [Op.gte]: lastWeek }
      }
    });

    return {
      total,
      active,
      deleted,
      createdToday,
      createdLastWeek,
      deletedPercentage: total > 0 ? Math.round((deleted / total) * 100) : 0
    };
  }
}

export default BaseModel;