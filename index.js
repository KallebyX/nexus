/**
 * Nexus Framework - Entry Point Principal
 * Exporta todos os módulos para uso em qualquer projeto
 */

// Módulos Core
export { AuthModule } from './modules/auth/index.js';
export { DatabaseModule } from './modules/database/index.js';
export { UIModule } from './modules/ui/index-simple.js';
export { AIModule } from './modules/ai/index.js';
export { MonitoringModule } from './modules/monitoring/index.js';
export { PaymentsModule } from './modules/payments/index.js';
export { NotificationsModule } from './modules/notifications/index.js';
export { TestingModule } from './modules/testing/index.js';
export { DockerModule } from './modules/docker/index.js';

// Sistemas
export { MarketplaceModule } from './marketplace/index.js';
export { IntegrationsModule } from './integrations/index.js';

// Templates para inicialização rápida
export { BackendTemplate } from './templates/backend/index.js';
export { MicroserviceTemplate } from './templates/microservice/index.js';

// Componentes UI prontos para React
export * from './modules/ui/components/index.js';

// Hooks personalizados
export * from './modules/ui/hooks/index.js';

// Utilitários
export * from './utils/index.js';

// Configuração padrão
export { default as defaultConfig } from './nexus.config.js';

/**
 * Configuração e inicialização do Nexus
 */
export class NexusFramework {
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.modules = new Map();
  }

  /**
   * Inicializar módulo específico
   */
  async useModule(moduleName, moduleConfig = {}) {
    const ModuleClass = this.getModuleClass(moduleName);
    const module = new ModuleClass({
      ...this.config.modules?.[moduleName],
      ...moduleConfig
    });

    this.modules.set(moduleName, module);
    return module;
  }

  /**
   * Inicializar múltiplos módulos
   */
  async useModules(moduleConfigs) {
    const modules = {};
    
    for (const [name, config] of Object.entries(moduleConfigs)) {
      modules[name] = await this.useModule(name, config);
    }
    
    return modules;
  }

  /**
   * Obter módulo inicializado
   */
  getModule(moduleName) {
    return this.modules.get(moduleName);
  }

  /**
   * Verificar se módulo está disponível
   */
  hasModule(moduleName) {
    return this.modules.has(moduleName);
  }

  /**
   * Configuração rápida para projetos comuns
   */
  static async createApp(type = 'fullstack', config = {}) {
    const nexus = new NexusFramework(config);
    
    switch (type) {
      case 'backend':
        return await nexus.useModules({
          auth: {},
          database: {},
          monitoring: {},
          ...config.modules
        });
        
      case 'ecommerce':
        return await nexus.useModules({
          auth: {},
          database: {},
          payments: {},
          notifications: {},
          ui: {},
          ...config.modules
        });
        
      case 'saas':
        return await nexus.useModules({
          auth: {},
          database: {},
          payments: {},
          notifications: {},
          monitoring: {},
          testing: {},
          ...config.modules
        });
        
      case 'fullstack':
      default:
        return await nexus.useModules({
          auth: {},
          database: {},
          ui: {},
          monitoring: {},
          ai: {},
          ...config.modules
        });
    }
  }

  getModuleClass(moduleName) {
    const moduleMap = {
      auth: AuthModule,
      database: DatabaseModule,
      ui: UIModule,
      ai: AIModule,
      monitoring: MonitoringModule,
      payments: PaymentsModule,
      notifications: NotificationsModule,
      testing: TestingModule,
      marketplace: MarketplaceModule,
      integrations: IntegrationsModule
    };

    const ModuleClass = moduleMap[moduleName];
    if (!ModuleClass) {
      throw new Error(`Módulo não encontrado: ${moduleName}`);
    }

    return ModuleClass;
  }

  /**
   * Health check de todos os módulos
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      framework: 'Nexus',
      version: '1.0.0',
      modules: {}
    };

    for (const [name, module] of this.modules) {
      try {
        if (typeof module.healthCheck === 'function') {
          health.modules[name] = await module.healthCheck();
        } else {
          health.modules[name] = { status: 'active' };
        }
      } catch (error) {
        health.modules[name] = { 
          status: 'error', 
          error: error.message 
        };
        health.status = 'degraded';
      }
    }

    return health;
  }
}

export default NexusFramework;