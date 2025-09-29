/**
 * Database Module - Nexus Framework
 * Sistema completo de banco de dados com Sequelize ORM
 */

import { Sequelize } from 'sequelize';
import { DatabaseConfig } from './config.js';

// Import dos modelos
import User from './models/User.js';
import UserSession from './models/UserSession.js';
import ActivityLog from './models/ActivityLog.js';
import Permission from './models/Permission.js';
import Role from './models/Role.js';
import Setting from './models/Setting.js';

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
      this.sequelize = await this.config.initializePostgres();
      this.initializeModels();
      this.createAssociations();
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
    this.User = User.init(this.sequelize);
    this.UserSession = UserSession.init(this.sequelize);
    this.ActivityLog = ActivityLog.init(this.sequelize);
    this.Permission = Permission.init(this.sequelize);
    this.Role = Role.init(this.sequelize);
    this.Setting = Setting.init(this.sequelize);

    this.models = {
      User: this.User,
      UserSession: this.UserSession,
      ActivityLog: this.ActivityLog,
      Permission: this.Permission,
      Role: this.Role,
      Setting: this.Setting
    };
    console.log('✅ Modelos inicializados');
  }

  createAssociations() {
    console.log('🔗 Criando associações entre modelos...');
    if (this.User.associate) this.User.associate(this.models);
    if (this.UserSession.associate) this.UserSession.associate(this.models);
    if (this.ActivityLog.associate) this.ActivityLog.associate(this.models);
    if (this.Permission.associate) this.Permission.associate(this.models);
    if (this.Role.associate) this.Role.associate(this.models);
    if (this.Setting.associate) this.Setting.associate(this.models);
    console.log('✅ Associações criadas');
  }

  async syncDatabase(force = false) {
    try {
      console.log('🔄 Sincronizando banco de dados...');
      await this.sequelize.sync({ force });
      await this.createInitialData();
      console.log('✅ Banco sincronizado');
    } catch (error) {
      console.error('❌ Erro ao sincronizar banco:', error);
      throw error;
    }
  }

  async createInitialData() {
    try {
      const permissionsCount = await this.Permission.createSystemPermissions();
      console.log(`📋 ${permissionsCount} permissões criadas`);
      const rolesCount = await this.Role.createSystemRoles();
      console.log(`👥 ${rolesCount} roles criados`);
      const settingsCount = await this.Setting.createSystemSettings();
      console.log(`⚙️ ${settingsCount} configurações criadas`);
    } catch (error) {
      console.error('❌ Erro ao criar dados iniciais:', error);
    }
  }

  // Getters
  get User() { return this.models.User; }
  get UserSession() { return this.models.UserSession; }
  get ActivityLog() { return this.models.ActivityLog; }
  get Permission() { return this.models.Permission; }
  get Role() { return this.models.Role; }
  get Setting() { return this.models.Setting; }
}

let dbInstance = null;

export async function initializeDatabase(config = {}) {
  if (!dbInstance) {
    dbInstance = new DatabaseModule(config);
    await dbInstance.initialize();
  }
  return dbInstance;
}

export async function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database não foi inicializado');
  }
  return dbInstance;
}

export { DatabaseConfig };
export default DatabaseModule;
