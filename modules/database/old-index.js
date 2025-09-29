/**
 * Database Module - Nexus Framework
 * Sistema completo de banco de dados com Sequelize ORM
 */

import { Sequelize } from 'sequelize';
import { DatabaseConfig } from './config.js';

// Import dos modelos
import { User } from './models/User.js';
import { UserSession } from './models/UserSession.js';
import { ActivityLog } from './models/ActivityLog.js';

export class DatabaseModule {
  constructor(config = {}) {
    this.config = new DatabaseConfig(config);
    this.sequelize = null;
    this.models = {};
    this.isInitialized = false;
  }

  async initialize() {
    try {
      console.log('🗄️  Inicializando Database Module...');

      // Conectar ao PostgreSQL
      this.sequelize = await this.config.initializePostgres();

      // Inicializar modelos
      this.initializeModels();

      // Criar associações
      this.createAssociations();

      // Sincronizar banco (apenas em desenvolvimento)
      if (process.env.NODE_ENV === 'development') {
        await this.syncDatabase();
      }

      this.isInitialized = true;
      console.log('✅ Database Module inicializado com sucesso');
      
      return this;
    } catch (error) {
      console.error('❌ Erro ao inicializar Database Module:', error);
      throw error;
    }
  }

  initializeModels() {
    console.log('📋 Inicializando modelos...');

    // Inicializar cada modelo
    this.models.User = User.init(this.sequelize);
    this.models.UserSession = UserSession.init(this.sequelize);
    this.models.ActivityLog = ActivityLog.init(this.sequelize);

    console.log(`✅ ${Object.keys(this.models).length} modelos inicializados`);
  }

  createAssociations() {
    console.log('🔗 Criando associações entre modelos...');

    // Criar associações se os modelos têm o método associate
    Object.values(this.models).forEach(model => {
      if (model.associate) {
        model.associate(this.models);
      }
    });

    console.log('✅ Associações criadas');
  }

  async syncDatabase(force = false) {
    console.log('🔄 Sincronizando banco de dados...');
    
    try {
      await this.sequelize.sync({ 
        force,
        alter: !force && process.env.NODE_ENV === 'development'
      });
      
      console.log('✅ Banco de dados sincronizado');
    } catch (error) {
      console.error('❌ Erro ao sincronizar banco:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      // Verificar conexão com PostgreSQL
      await this.sequelize.authenticate();
      
      // Verificar modelos
      const modelStatus = {};
      for (const [name, model] of Object.entries(this.models)) {
        try {
          await model.findOne({ limit: 1 });
          modelStatus[name] = 'ok';
        } catch (error) {
          modelStatus[name] = 'error';
        }
      }

      return {
        database: 'connected',
        models: modelStatus,
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        database: 'error',
        error: error.message,
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      };
    }
  }

  async connect() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.sequelize;
  }

  async disconnect() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('🔌 Conexão com banco fechada');
    }
  }

  // Getters para modelos
  get User() {
    return this.models.User;
  }

  get UserSession() {
    return this.models.UserSession;
  }

  get ActivityLog() {
    return this.models.ActivityLog;
  }

  // Getter para conexão
  get connection() {
    return this.sequelize;
  }
}

  // Método para executar migrações
  async runMigrations() {
    const migrations = [
      this.createUsersTable,
      this.createLogsTable,
      this.createMetricsTable,
      this.createAuditTable
    ];

    for (const migration of migrations) {
      try {
        await migration.call(this);
        console.log(`✅ Migração executada: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Erro na migração ${migration.name}:`, error);
      }
    }
  }

  // Migrações das tabelas base
  async createUsersTable() {
    // Esta seria a estrutura SQL para criar a tabela users
    const sql = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    // Em produção, usaria o método apropriado do provider
    console.log('Creating users table...');
  }

  async createLogsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        level VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Creating logs table...');
  }

  async createMetricsTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        value NUMERIC NOT NULL,
        tags JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Creating metrics table...');
  }

  async createAuditTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(255) NOT NULL,
        table_name VARCHAR(255) NOT NULL,
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        user_id UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    console.log('Creating audit_logs table...');
  }
}

// Modelo base para todos os outros modelos
class BaseModel {
  constructor(client, tableName) {
    this.client = client;
    this.tableName = tableName;
  }

  async findById(id) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async findAll(filters = {}, options = {}) {
    let query = this.client.from(this.tableName).select('*');

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Aplicar opções (limit, order, etc.)
    if (options.limit) query = query.limit(options.limit);
    if (options.orderBy) query = query.order(options.orderBy);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async create(data) {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  async update(id, data) {
    const { data: result, error } = await this.client
      .from(this.tableName)
      .update({ ...data, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  async delete(id) {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }
}

// Modelo de usuários
class UserModel extends BaseModel {
  constructor(client) {
    super(client, 'users');
  }

  async findByEmail(email) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }
    return data;
  }

  async findByRole(role) {
    return this.findAll({ role });
  }

  async updateLastLogin(id) {
    return this.update(id, { 
      last_login: new Date(),
      metadata: { last_login: new Date() }
    });
  }
}

// Modelo de logs
class LogModel extends BaseModel {
  constructor(client) {
    super(client, 'logs');
  }

  async createLog(level, message, metadata = {}, userId = null) {
    return this.create({
      level,
      message,
      metadata,
      user_id: userId
    });
  }

  async findByLevel(level, limit = 100) {
    return this.findAll({ level }, { limit, orderBy: 'created_at desc' });
  }

  async findByUser(userId, limit = 100) {
    return this.findAll({ user_id: userId }, { limit, orderBy: 'created_at desc' });
  }
}

// Modelo de métricas
class MetricModel extends BaseModel {
  constructor(client) {
    super(client, 'metrics');
  }

  async recordMetric(name, value, tags = {}) {
    return this.create({
      name,
      value,
      tags
    });
  }

  async getMetricsByName(name, startDate = null, endDate = null) {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('name', name)
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  async getAverageMetric(name, startDate, endDate) {
    const { data, error } = await this.client
      .rpc('calculate_metric_average', {
        metric_name: name,
        start_date: startDate,
        end_date: endDate
      });

    if (error) throw new Error(error.message);
    return data;
  }
}

// Modelo de auditoria
class AuditModel extends BaseModel {
  constructor(client) {
    super(client, 'audit_logs');
  }

  async logAction(action, tableName, recordId, oldValues, newValues, userId) {
    return this.create({
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      user_id: userId
    });
  }

  async getAuditTrail(tableName, recordId) {
    return this.findAll(
      { table_name: tableName, record_id: recordId },
      { orderBy: 'created_at desc' }
    );
  }

  async getUserActions(userId, limit = 50) {
    return this.findAll(
      { user_id: userId },
      { limit, orderBy: 'created_at desc' }
    );
  }
}

export default DatabaseModule;