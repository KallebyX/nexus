/**
 * Database Configuration - Nexus Framework
 * Configuração centralizada para múltiplos bancos de dados
 */

import { Sequelize } from 'sequelize';
import { createClient } from 'redis';
import pg from 'pg';

export class DatabaseConfig {
  constructor(config = {}) {
    this.config = {
      // PostgreSQL Principal
      postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'nexus',
        username: process.env.POSTGRES_USER || 'nexus',
        password: process.env.POSTGRES_PASSWORD || 'nexus123',
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        define: {
          timestamps: true,
          underscored: true,
          paranoid: true, // Soft deletes
          freezeTableName: true
        }
      },

      // Redis Cache
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3
      },

      // MongoDB (opcional para logs/analytics)
      mongodb: {
        url: process.env.MONGODB_URL || 'mongodb://localhost:27017/nexus',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000
        }
      },

      // Configurações específicas do ambiente
      environment: process.env.NODE_ENV || 'development',
      
      ...config
    };

    this.connections = {
      postgres: null,
      redis: null,
      mongodb: null
    };

    this.models = {};
    this.isConnected = false;
  }

  // Inicializar conexão PostgreSQL
  async initializePostgres() {
    try {
      console.log('🗄️  Conectando ao PostgreSQL...');
      
      this.connections.postgres = new Sequelize(
        this.config.postgres.database,
        this.config.postgres.username,
        this.config.postgres.password,
        {
          host: this.config.postgres.host,
          port: this.config.postgres.port,
          dialect: this.config.postgres.dialect,
          logging: this.config.postgres.logging,
          pool: this.config.postgres.pool,
          define: this.config.postgres.define
        }
      );

      // Testar conexão
      await this.connections.postgres.authenticate();
      console.log('✅ PostgreSQL conectado com sucesso');
      
      return this.connections.postgres;
    } catch (error) {
      console.error('❌ Erro ao conectar PostgreSQL:', error);
      throw error;
    }
  }

  // Inicializar conexão Redis
  async initializeRedis() {
    try {
      console.log('🔴 Conectando ao Redis...');
      
      this.connections.redis = createClient({
        socket: {
          host: this.config.redis.host,
          port: this.config.redis.port
        },
        password: this.config.redis.password || undefined,
        database: this.config.redis.db
      });

      this.connections.redis.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      this.connections.redis.on('connect', () => {
        console.log('✅ Redis conectado com sucesso');
      });

      await this.connections.redis.connect();
      return this.connections.redis;
    } catch (error) {
      console.error('❌ Erro ao conectar Redis:', error);
      throw error;
    }
  }

  // Inicializar conexão MongoDB (opcional)
  async initializeMongoDB() {
    try {
      console.log('🍃 Conectando ao MongoDB...');
      
      const { MongoClient } = await import('mongodb');
      this.connections.mongodb = new MongoClient(
        this.config.mongodb.url,
        this.config.mongodb.options
      );

      await this.connections.mongodb.connect();
      console.log('✅ MongoDB conectado com sucesso');
      
      return this.connections.mongodb;
    } catch (error) {
      console.error('❌ Erro ao conectar MongoDB:', error);
      throw error;
    }
  }

  // Conectar todos os bancos
  async connect() {
    try {
      await this.initializePostgres();
      await this.initializeRedis();
      
      // MongoDB é opcional
      if (this.config.mongodb.url) {
        await this.initializeMongoDB();
      }

      this.isConnected = true;
      console.log('🚀 Todas as conexões de banco inicializadas');
      
      return {
        postgres: this.connections.postgres,
        redis: this.connections.redis,
        mongodb: this.connections.mongodb
      };
    } catch (error) {
      console.error('❌ Erro ao conectar bancos:', error);
      throw error;
    }
  }

  // Desconectar todos os bancos
  async disconnect() {
    try {
      if (this.connections.postgres) {
        await this.connections.postgres.close();
        console.log('✅ PostgreSQL desconectado');
      }

      if (this.connections.redis) {
        await this.connections.redis.quit();
        console.log('✅ Redis desconectado');
      }

      if (this.connections.mongodb) {
        await this.connections.mongodb.close();
        console.log('✅ MongoDB desconectado');
      }

      this.isConnected = false;
      console.log('🔌 Todas as conexões fechadas');
    } catch (error) {
      console.error('❌ Erro ao desconectar:', error);
    }
  }

  // Health check de todas as conexões
  async healthCheck() {
    const health = {
      postgres: false,
      redis: false,
      mongodb: false,
      timestamp: new Date().toISOString()
    };

    try {
      // PostgreSQL health check
      if (this.connections.postgres) {
        await this.connections.postgres.authenticate();
        health.postgres = true;
      }

      // Redis health check
      if (this.connections.redis && this.connections.redis.isOpen) {
        await this.connections.redis.ping();
        health.redis = true;
      }

      // MongoDB health check
      if (this.connections.mongodb) {
        await this.connections.mongodb.db().admin().ping();
        health.mongodb = true;
      }

      return health;
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      return health;
    }
  }

  // Getter para conexões
  get postgres() {
    return this.connections.postgres;
  }

  get redis() {
    return this.connections.redis;
  }

  get mongodb() {
    return this.connections.mongodb;
  }
}

export default DatabaseConfig;