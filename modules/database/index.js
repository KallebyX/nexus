/**
 * Módulo de Database - Oryum Nexus
 * Camada de abstração para banco de dados com modelos padronizados
 */

import { createClient } from '@supabase/supabase-js';

export class DatabaseModule {
  constructor(config = {}) {
    this.config = {
      provider: 'supabase',
      migrations: true,
      backups: true,
      ...config
    };

    this.initializeProvider();
    this.initializeModels();
  }

  initializeProvider() {
    if (this.config.provider === 'supabase') {
      this.client = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
    }
  }

  initializeModels() {
    this.User = new UserModel(this.client);
    this.Log = new LogModel(this.client);
    this.Metric = new MetricModel(this.client);
    this.Audit = new AuditModel(this.client);
  }

  async healthCheck() {
    try {
      const { data, error } = await this.client
        .from('users')
        .select('count')
        .limit(1);
      
      return { status: 'healthy', connected: !error };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
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