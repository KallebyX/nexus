/**
 * Marketplace de Módulos - Oryum Nexus
 * Sistema interno para instalar, atualizar e gerenciar módulos
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import semver from 'semver';
import tar from 'tar';
import crypto from 'crypto';

export class MarketplaceModule {
  constructor(config = {}) {
    this.config = {
      registryUrl: 'https://registry.nexus.oryum.tech',
      localRegistry: path.join(process.cwd(), '.nexus', 'registry'),
      modulesPath: path.join(process.cwd(), 'modules'),
      cacheDir: path.join(process.cwd(), '.nexus', 'cache'),
      autoUpdate: false,
      verifySignatures: true,
      allowBeta: false,
      trustedPublishers: ['@oryum', '@nexus-core'],
      ...config
    };

    this.installedModules = new Map();
    this.registry = new Map();
    
    this.loadLocalRegistry();
    this.loadInstalledModules();
  }

  async loadLocalRegistry() {
    try {
      const registryPath = path.join(this.config.localRegistry, 'modules.json');
      const registryData = await fs.readFile(registryPath, 'utf-8');
      const modules = JSON.parse(registryData);
      
      modules.forEach(module => {
        this.registry.set(module.name, module);
      });
    } catch (error) {
      // Registry local não existe, será criado na primeira sincronização
      console.log('Registry local não encontrado, será criado automaticamente');
    }
  }

  async loadInstalledModules() {
    try {
      const nexusConfig = path.join(process.cwd(), 'nexus.config.js');
      if (await this.fileExists(nexusConfig)) {
        const { modules } = await import(nexusConfig);
        
        if (modules) {
          Object.entries(modules).forEach(([name, config]) => {
            this.installedModules.set(name, {
              name,
              version: config.version || '1.0.0',
              config,
              enabled: config.enabled !== false
            });
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar módulos instalados:', error);
    }
  }

  /**
   * Sincronizar com registry remoto
   */
  async syncRegistry() {
    console.log('🔄 Sincronizando registry...');

    try {
      const response = await fetch(`${this.config.registryUrl}/modules`);
      const modules = await response.json();

      // Criar diretório do registry local
      await fs.mkdir(this.config.localRegistry, { recursive: true });

      // Salvar registry local
      await fs.writeFile(
        path.join(this.config.localRegistry, 'modules.json'),
        JSON.stringify(modules, null, 2)
      );

      // Atualizar registry em memória
      this.registry.clear();
      modules.forEach(module => {
        this.registry.set(module.name, module);
      });

      console.log(`✅ Registry sincronizado: ${modules.length} módulos disponíveis`);
      return { success: true, modules: modules.length };
    } catch (error) {
      console.error('Erro ao sincronizar registry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Buscar módulos no registry
   */
  async searchModules(query = '', filters = {}) {
    const results = [];

    this.registry.forEach(module => {
      // Filtro por query
      if (query && !this.matchesQuery(module, query)) {
        return;
      }

      // Filtros específicos
      if (filters.category && module.category !== filters.category) {
        return;
      }

      if (filters.publisher && !module.publisher.includes(filters.publisher)) {
        return;
      }

      if (filters.minRating && module.rating < filters.minRating) {
        return;
      }

      // Verificar se é beta
      if (!this.config.allowBeta && module.version.includes('beta')) {
        return;
      }

      results.push({
        ...module,
        installed: this.isModuleInstalled(module.name),
        installedVersion: this.getInstalledVersion(module.name),
        updateAvailable: this.hasUpdateAvailable(module.name, module.version)
      });
    });

    // Ordenar por relevância e rating
    results.sort((a, b) => {
      if (query) {
        const aRelevance = this.calculateRelevance(a, query);
        const bRelevance = this.calculateRelevance(b, query);
        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }
      }
      return b.rating - a.rating;
    });

    return results;
  }

  matchesQuery(module, query) {
    const searchText = `${module.name} ${module.description} ${module.keywords?.join(' ') || ''}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  }

  calculateRelevance(module, query) {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Nome exato
    if (module.name.toLowerCase() === queryLower) score += 100;
    // Nome contém query
    else if (module.name.toLowerCase().includes(queryLower)) score += 50;
    
    // Descrição contém query
    if (module.description.toLowerCase().includes(queryLower)) score += 25;
    
    // Keywords contêm query
    if (module.keywords?.some(k => k.toLowerCase().includes(queryLower))) score += 15;

    return score;
  }

  /**
   * Instalar módulo
   */
  async installModule(moduleName, version = 'latest', options = {}) {
    console.log(`📦 Instalando módulo: ${moduleName}@${version}`);

    try {
      // Verificar se módulo existe no registry
      const module = this.registry.get(moduleName);
      if (!module) {
        throw new Error(`Módulo não encontrado: ${moduleName}`);
      }

      // Determinar versão a instalar
      const targetVersion = version === 'latest' ? module.version : version;
      
      // Verificar compatibilidade
      if (!semver.satisfies(targetVersion, module.compatibility?.nexus || '*')) {
        throw new Error(`Módulo ${moduleName}@${targetVersion} não é compatível com esta versão do Nexus`);
      }

      // Verificar dependências
      if (module.dependencies) {
        await this.resolveDependencies(module.dependencies);
      }

      // Baixar módulo
      const downloadPath = await this.downloadModule(moduleName, targetVersion);
      
      // Verificar integridade
      if (this.config.verifySignatures) {
        await this.verifyModuleIntegrity(downloadPath, module);
      }

      // Extrair módulo
      const modulePath = await this.extractModule(downloadPath, moduleName);

      // Executar scripts de instalação
      await this.runInstallScripts(modulePath, module);

      // Atualizar configuração
      await this.updateModuleConfig(moduleName, {
        version: targetVersion,
        enabled: true,
        installedAt: new Date().toISOString(),
        ...options
      });

      // Limpar cache
      await this.cleanupDownload(downloadPath);

      console.log(`✅ Módulo ${moduleName}@${targetVersion} instalado com sucesso`);

      return {
        success: true,
        module: moduleName,
        version: targetVersion,
        path: modulePath
      };
    } catch (error) {
      console.error(`Erro ao instalar ${moduleName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async resolveDependencies(dependencies) {
    for (const [depName, depVersion] of Object.entries(dependencies)) {
      if (!this.isModuleInstalled(depName)) {
        console.log(`📦 Instalando dependência: ${depName}@${depVersion}`);
        const result = await this.installModule(depName, depVersion);
        if (!result.success) {
          throw new Error(`Falha ao instalar dependência ${depName}: ${result.error}`);
        }
      } else {
        const installedVersion = this.getInstalledVersion(depName);
        if (!semver.satisfies(installedVersion, depVersion)) {
          throw new Error(`Conflito de dependência: ${depName} requer ${depVersion}, mas ${installedVersion} está instalado`);
        }
      }
    }
  }

  async downloadModule(moduleName, version) {
    const downloadUrl = `${this.config.registryUrl}/download/${moduleName}/${version}`;
    const cacheDir = path.join(this.config.cacheDir, 'downloads');
    const downloadPath = path.join(cacheDir, `${moduleName}-${version}.tar.gz`);

    await fs.mkdir(cacheDir, { recursive: true });

    console.log(`⬇️ Baixando ${moduleName}@${version}...`);

    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Falha no download: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await fs.writeFile(downloadPath, Buffer.from(buffer));

    return downloadPath;
  }

  async verifyModuleIntegrity(filePath, module) {
    if (!module.checksum) return;

    const fileBuffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (hash !== module.checksum) {
      throw new Error('Falha na verificação de integridade do módulo');
    }
  }

  async extractModule(downloadPath, moduleName) {
    const extractPath = path.join(this.config.modulesPath, moduleName);

    // Remover versão anterior se existir
    try {
      await fs.rm(extractPath, { recursive: true });
    } catch (error) {
      // Ignorar se não existir
    }

    await fs.mkdir(extractPath, { recursive: true });

    // Extrair arquivo tar.gz
    await tar.extract({
      file: downloadPath,
      cwd: extractPath,
      strip: 1 // Remove o diretório raiz do tar
    });

    return extractPath;
  }

  async runInstallScripts(modulePath, module) {
    const scriptsPath = path.join(modulePath, 'scripts');
    
    try {
      const installScript = path.join(scriptsPath, 'install.js');
      if (await this.fileExists(installScript)) {
        console.log('🔧 Executando script de instalação...');
        const { install } = await import(installScript);
        if (typeof install === 'function') {
          await install({ config: this.config, modulePath });
        }
      }
    } catch (error) {
      console.warn('Aviso: Erro ao executar script de instalação:', error.message);
    }
  }

  /**
   * Atualizar módulo
   */
  async updateModule(moduleName, version = 'latest') {
    console.log(`🔄 Atualizando módulo: ${moduleName}`);

    if (!this.isModuleInstalled(moduleName)) {
      throw new Error(`Módulo não instalado: ${moduleName}`);
    }

    const currentVersion = this.getInstalledVersion(moduleName);
    const module = this.registry.get(moduleName);
    const targetVersion = version === 'latest' ? module.version : version;

    if (semver.gte(currentVersion, targetVersion)) {
      console.log(`✅ ${moduleName} já está na versão mais recente (${currentVersion})`);
      return { success: true, alreadyLatest: true };
    }

    // Executar backup antes da atualização
    await this.backupModule(moduleName);

    try {
      const result = await this.installModule(moduleName, targetVersion);
      if (result.success) {
        console.log(`✅ ${moduleName} atualizado de ${currentVersion} para ${targetVersion}`);
      }
      return result;
    } catch (error) {
      // Restaurar backup em caso de erro
      await this.restoreModule(moduleName);
      throw error;
    }
  }

  async backupModule(moduleName) {
    const modulePath = path.join(this.config.modulesPath, moduleName);
    const backupPath = path.join(this.config.cacheDir, 'backups', `${moduleName}-${Date.now()}`);

    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    await fs.cp(modulePath, backupPath, { recursive: true });

    return backupPath;
  }

  async restoreModule(moduleName) {
    const backupsDir = path.join(this.config.cacheDir, 'backups');
    const backups = await fs.readdir(backupsDir);
    const moduleBackups = backups.filter(b => b.startsWith(`${moduleName}-`))
      .sort((a, b) => {
        const timeA = parseInt(a.split('-').pop());
        const timeB = parseInt(b.split('-').pop());
        return timeB - timeA; // Mais recente primeiro
      });

    if (moduleBackups.length === 0) {
      throw new Error(`Nenhum backup encontrado para ${moduleName}`);
    }

    const latestBackup = path.join(backupsDir, moduleBackups[0]);
    const modulePath = path.join(this.config.modulesPath, moduleName);

    await fs.rm(modulePath, { recursive: true });
    await fs.cp(latestBackup, modulePath, { recursive: true });

    console.log(`🔄 Módulo ${moduleName} restaurado do backup`);
  }

  /**
   * Desinstalar módulo
   */
  async uninstallModule(moduleName, options = {}) {
    console.log(`🗑️ Desinstalando módulo: ${moduleName}`);

    if (!this.isModuleInstalled(moduleName)) {
      throw new Error(`Módulo não instalado: ${moduleName}`);
    }

    try {
      const modulePath = path.join(this.config.modulesPath, moduleName);

      // Verificar dependências
      if (!options.force) {
        const dependents = await this.findDependentModules(moduleName);
        if (dependents.length > 0) {
          throw new Error(
            `Não é possível desinstalar ${moduleName}. Módulos dependentes: ${dependents.join(', ')}`
          );
        }
      }

      // Executar scripts de desinstalação
      await this.runUninstallScripts(modulePath);

      // Remover arquivos
      await fs.rm(modulePath, { recursive: true });

      // Atualizar configuração
      await this.removeModuleConfig(moduleName);

      console.log(`✅ Módulo ${moduleName} desinstalado com sucesso`);

      return { success: true };
    } catch (error) {
      console.error(`Erro ao desinstalar ${moduleName}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async runUninstallScripts(modulePath) {
    try {
      const scriptsPath = path.join(modulePath, 'scripts');
      const uninstallScript = path.join(scriptsPath, 'uninstall.js');
      
      if (await this.fileExists(uninstallScript)) {
        console.log('🔧 Executando script de desinstalação...');
        const { uninstall } = await import(uninstallScript);
        if (typeof uninstall === 'function') {
          await uninstall({ config: this.config, modulePath });
        }
      }
    } catch (error) {
      console.warn('Aviso: Erro ao executar script de desinstalação:', error.message);
    }
  }

  async findDependentModules(moduleName) {
    const dependents = [];

    for (const [name, moduleInfo] of this.installedModules) {
      if (name === moduleName) continue;

      const moduleData = this.registry.get(name);
      if (moduleData?.dependencies?.[moduleName]) {
        dependents.push(name);
      }
    }

    return dependents;
  }

  /**
   * Listar módulos instalados
   */
  async listInstalledModules() {
    const modules = [];

    for (const [name, info] of this.installedModules) {
      const registryData = this.registry.get(name);
      modules.push({
        name,
        version: info.version,
        enabled: info.enabled,
        updateAvailable: this.hasUpdateAvailable(name, info.version),
        latestVersion: registryData?.version,
        description: registryData?.description,
        size: await this.getModuleSize(name)
      });
    }

    return modules.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getModuleSize(moduleName) {
    try {
      const modulePath = path.join(this.config.modulesPath, moduleName);
      const stats = await fs.stat(modulePath);
      return this.formatFileSize(stats.size);
    } catch (error) {
      return 'Unknown';
    }
  }

  formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verificar atualizações disponíveis
   */
  async checkUpdates() {
    const updates = [];

    for (const [name, info] of this.installedModules) {
      if (this.hasUpdateAvailable(name, info.version)) {
        const registryData = this.registry.get(name);
        updates.push({
          name,
          currentVersion: info.version,
          latestVersion: registryData.version,
          description: registryData.description
        });
      }
    }

    return updates;
  }

  /**
   * Atualizar todos os módulos
   */
  async updateAllModules() {
    console.log('🔄 Verificando atualizações para todos os módulos...');

    const updates = await this.checkUpdates();
    if (updates.length === 0) {
      console.log('✅ Todos os módulos estão atualizados');
      return { success: true, updated: 0 };
    }

    const results = [];
    let successCount = 0;

    for (const update of updates) {
      try {
        const result = await this.updateModule(update.name);
        results.push({ ...update, ...result });
        if (result.success) successCount++;
      } catch (error) {
        results.push({
          ...update,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`✅ ${successCount}/${updates.length} módulos atualizados com sucesso`);

    return {
      success: successCount === updates.length,
      updated: successCount,
      total: updates.length,
      results
    };
  }

  /**
   * Habilitar/Desabilitar módulo
   */
  async toggleModule(moduleName, enabled) {
    if (!this.isModuleInstalled(moduleName)) {
      throw new Error(`Módulo não instalado: ${moduleName}`);
    }

    await this.updateModuleConfig(moduleName, { enabled });
    
    const moduleInfo = this.installedModules.get(moduleName);
    moduleInfo.enabled = enabled;

    console.log(`${enabled ? '✅ Habilitado' : '❌ Desabilitado'}: ${moduleName}`);

    return { success: true, enabled };
  }

  // Métodos auxiliares
  isModuleInstalled(moduleName) {
    return this.installedModules.has(moduleName);
  }

  getInstalledVersion(moduleName) {
    return this.installedModules.get(moduleName)?.version;
  }

  hasUpdateAvailable(moduleName, currentVersion) {
    const registryData = this.registry.get(moduleName);
    if (!registryData) return false;
    
    return semver.gt(registryData.version, currentVersion);
  }

  async updateModuleConfig(moduleName, config) {
    const nexusConfigPath = path.join(process.cwd(), 'nexus.config.js');
    
    try {
      let configContent = await fs.readFile(nexusConfigPath, 'utf-8');
      
      // Parse do arquivo de configuração (simplificado)
      const moduleConfigRegex = new RegExp(`${moduleName}:\\s*{[^}]*}`, 'g');
      const newModuleConfig = `${moduleName}: ${JSON.stringify(config, null, 4)}`;
      
      if (moduleConfigRegex.test(configContent)) {
        configContent = configContent.replace(moduleConfigRegex, newModuleConfig);
      } else {
        // Adicionar novo módulo
        configContent = configContent.replace(
          /modules:\s*{/,
          `modules: {\n    ${newModuleConfig},`
        );
      }
      
      await fs.writeFile(nexusConfigPath, configContent);
      
      // Atualizar cache em memória
      this.installedModules.set(moduleName, {
        name: moduleName,
        ...config
      });
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
    }
  }

  async removeModuleConfig(moduleName) {
    const nexusConfigPath = path.join(process.cwd(), 'nexus.config.js');
    
    try {
      let configContent = await fs.readFile(nexusConfigPath, 'utf-8');
      
      // Remover configuração do módulo
      const moduleConfigRegex = new RegExp(`\\s*${moduleName}:\\s*{[^}]*},?`, 'g');
      configContent = configContent.replace(moduleConfigRegex, '');
      
      await fs.writeFile(nexusConfigPath, configContent);
      
      // Remover do cache em memória
      this.installedModules.delete(moduleName);
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Health check do marketplace
   */
  async healthCheck() {
    const health = {
      status: 'healthy',
      registry: {
        local: this.registry.size,
        lastSync: null
      },
      installed: this.installedModules.size,
      updates: 0
    };

    try {
      // Verificar conectividade com registry remoto
      const response = await fetch(`${this.config.registryUrl}/health`, {
        timeout: 5000
      });
      health.registry.remote = response.ok;
    } catch (error) {
      health.registry.remote = false;
      health.status = 'degraded';
    }

    // Contar atualizações disponíveis
    const updates = await this.checkUpdates();
    health.updates = updates.length;

    return health;
  }
}

export default MarketplaceModule;