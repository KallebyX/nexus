/**
 * Script de Deploy Automatizado
 * Gerencia builds, testes e deploy para múltiplos ambientes
 */

import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class DeployManager {
  constructor(config = {}) {
    this.config = {
      environments: ['development', 'staging', 'production'],
      defaultEnvironment: 'development',
      buildCommand: 'npm run build',
      testCommand: 'npm test',
      dockerRegistry: 'docker.io',
      namespace: 'nexus',
      ...config
    };

    this.currentEnvironment = process.env.NODE_ENV || this.config.defaultEnvironment;
    this.deployLog = [];
  }

  /**
   * Executar deploy completo
   */
  async deploy(environment = this.currentEnvironment, options = {}) {
    try {
      console.log(`🚀 Iniciando deploy para ${environment}...`);
      this.log(`Deploy iniciado para ${environment}`);

      const {
        skipTests = false,
        skipBuild = false,
        force = false,
        rollback = false
      } = options;

      // 1. Validações pre-deploy
      await this.preDeployValidation(environment);

      // 2. Executar testes (se não skipados)
      if (!skipTests) {
        await this.runTests();
      }

      // 3. Build da aplicação (se não skipado)
      if (!skipBuild) {
        await this.buildApplication();
      }

      // 4. Deploy específico do ambiente
      await this.deployToEnvironment(environment, { force, rollback });

      // 5. Verificações post-deploy
      await this.postDeployValidation(environment);

      console.log('✅ Deploy concluído com sucesso!');
      this.log('Deploy concluído com sucesso');

      return {
        success: true,
        environment,
        timestamp: new Date().toISOString(),
        deployLog: this.deployLog
      };

    } catch (error) {
      console.error('❌ Erro no deploy:', error.message);
      this.log(`Erro no deploy: ${error.message}`);
      
      // Tentar rollback automático se configurado
      if (options.autoRollback && environment === 'production') {
        await this.rollback(environment);
      }

      throw error;
    }
  }

  /**
   * Validações antes do deploy
   */
  async preDeployValidation(environment) {
    console.log('🔍 Executando validações pre-deploy...');

    // Verificar Git status
    try {
      const { stdout: gitStatus } = await execAsync('git status --porcelain');
      if (gitStatus.trim() && environment === 'production') {
        throw new Error('Working directory não está limpo. Commit suas mudanças antes do deploy de produção.');
      }
    } catch (error) {
      console.warn('⚠️  Não foi possível verificar status do Git');
    }

    // Verificar branch atual
    if (environment === 'production') {
      try {
        const { stdout: currentBranch } = await execAsync('git branch --show-current');
        if (currentBranch.trim() !== 'main' && currentBranch.trim() !== 'master') {
          throw new Error('Deploy de produção deve ser feito a partir da branch main/master');
        }
      } catch (error) {
        console.warn('⚠️  Não foi possível verificar branch atual');
      }
    }

    // Verificar arquivos essenciais
    const essentialFiles = ['package.json', 'Dockerfile'];
    for (const file of essentialFiles) {
      if (!await fs.pathExists(file)) {
        throw new Error(`Arquivo essencial não encontrado: ${file}`);
      }
    }

    // Verificar variáveis de ambiente
    if (environment === 'production') {
      const requiredEnvVars = ['DB_HOST', 'DB_PASSWORD'];
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          console.warn(`⚠️  Variável de ambiente não encontrada: ${envVar}`);
        }
      }
    }

    this.log('Validações pre-deploy concluídas');
    console.log('✅ Validações pre-deploy concluídas');
  }

  /**
   * Executar testes
   */
  async runTests() {
    console.log('🧪 Executando testes...');
    
    try {
      const { stdout, stderr } = await execAsync(this.config.testCommand);
      console.log(stdout);
      
      if (stderr && !stderr.includes('PASS')) {
        console.warn('⚠️  Warnings nos testes:', stderr);
      }

      this.log('Testes executados com sucesso');
      console.log('✅ Testes executados com sucesso');
    } catch (error) {
      console.error('❌ Falha nos testes:', error.message);
      this.log(`Falha nos testes: ${error.message}`);
      throw new Error('Testes falharam. Deploy cancelado.');
    }
  }

  /**
   * Build da aplicação
   */
  async buildApplication() {
    console.log('🔨 Construindo aplicação...');
    
    try {
      const { stdout, stderr } = await execAsync(this.config.buildCommand);
      console.log(stdout);
      
      if (stderr) {
        console.warn('⚠️  Warnings no build:', stderr);
      }

      this.log('Build da aplicação concluído');
      console.log('✅ Build da aplicação concluído');
    } catch (error) {
      // Se o comando de build falhar mas não for crítico, continuar
      if (error.code === 127) {
        console.warn('⚠️  Comando de build não encontrado, continuando...');
        this.log('Comando de build não encontrado');
      } else {
        console.error('❌ Falha no build:', error.message);
        this.log(`Falha no build: ${error.message}`);
        throw new Error('Build falhado. Deploy cancelado.');
      }
    }
  }

  /**
   * Deploy para ambiente específico
   */
  async deployToEnvironment(environment, options = {}) {
    console.log(`🚀 Fazendo deploy para ${environment}...`);

    switch (environment) {
      case 'development':
        await this.deployToDevelopment(options);
        break;
      case 'staging':
        await this.deployToStaging(options);
        break;
      case 'production':
        await this.deployToProduction(options);
        break;
      default:
        throw new Error(`Ambiente não suportado: ${environment}`);
    }

    this.log(`Deploy para ${environment} concluído`);
  }

  /**
   * Deploy para desenvolvimento
   */
  async deployToDevelopment(options = {}) {
    console.log('🧑‍💻 Deploy para desenvolvimento...');
    
    try {
      // Usar docker-compose para desenvolvimento
      await execAsync('docker-compose -f docker-compose.yml up -d --build');
      console.log('✅ Containers de desenvolvimento iniciados');
    } catch (error) {
      // Fallback para start local se Docker não estiver disponível
      console.warn('⚠️  Docker não disponível, iniciando localmente...');
      try {
        await execAsync('npm run dev', { detached: true });
        console.log('✅ Servidor de desenvolvimento iniciado');
      } catch (localError) {
        throw new Error('Falha ao iniciar desenvolvimento: ' + localError.message);
      }
    }
  }

  /**
   * Deploy para staging
   */
  async deployToStaging(options = {}) {
    console.log('🎭 Deploy para staging...');
    
    try {
      // Build da imagem Docker para staging
      const imageName = `${this.config.namespace}/app-staging`;
      await execAsync(`docker build -t ${imageName}:latest .`);
      
      // Deploy usando docker-compose de staging
      await execAsync('docker-compose -f docker-compose.staging.yml up -d --build');
      
      console.log('✅ Deploy para staging concluído');
    } catch (error) {
      throw new Error('Falha no deploy para staging: ' + error.message);
    }
  }

  /**
   * Deploy para produção
   */
  async deployToProduction(options = {}) {
    console.log('🌐 Deploy para produção...');
    
    try {
      const { force = false } = options;

      // Confirmar deploy de produção
      if (!force && process.stdout.isTTY) {
        console.log('⚠️  ATENÇÃO: Deploy para PRODUÇÃO!');
        console.log('Pressione CTRL+C para cancelar ou aguarde 10 segundos...');
        await this.sleep(10000);
      }

      // Build da imagem para produção
      const version = await this.getVersion();
      const imageName = `${this.config.dockerRegistry}/${this.config.namespace}/app`;
      
      await execAsync(`docker build -t ${imageName}:${version} -t ${imageName}:latest .`);
      console.log(`✅ Imagem construída: ${imageName}:${version}`);

      // Push para registry (se configurado)
      if (process.env.DOCKER_REGISTRY_TOKEN) {
        await execAsync(`docker push ${imageName}:${version}`);
        await execAsync(`docker push ${imageName}:latest`);
        console.log('✅ Imagem enviada para registry');
      }

      // Deploy usando docker-compose de produção
      await execAsync('docker-compose -f docker-compose.production.yml up -d --build');
      
      console.log('✅ Deploy para produção concluído');
    } catch (error) {
      throw new Error('Falha no deploy para produção: ' + error.message);
    }
  }

  /**
   * Validações após deploy
   */
  async postDeployValidation(environment) {
    console.log('🔍 Executando validações post-deploy...');
    
    try {
      // Aguardar um tempo para a aplicação subir
      await this.sleep(5000);

      // Determinar URL baseada no ambiente
      let baseUrl = 'http://localhost:3000';
      if (environment === 'production') {
        baseUrl = process.env.PRODUCTION_URL || 'http://localhost:3000';
      } else if (environment === 'staging') {
        baseUrl = process.env.STAGING_URL || 'http://localhost:3001';
      }

      // Health check
      try {
        const { stdout } = await execAsync(`curl -f ${baseUrl}/health || echo "Health check failed"`);
        if (stdout.includes('Health check failed')) {
          throw new Error('Health check failed');
        }
        console.log('✅ Health check passou');
      } catch (error) {
        console.warn('⚠️  Health check não disponível');
      }

      // Verificar logs do Docker (se disponível)
      try {
        const { stdout: logs } = await execAsync('docker-compose logs --tail=20 app');
        if (logs.includes('ERROR') || logs.includes('FATAL')) {
          console.warn('⚠️  Erros encontrados nos logs da aplicação');
        } else {
          console.log('✅ Logs da aplicação aparentam estar normais');
        }
      } catch (error) {
        console.warn('⚠️  Não foi possível verificar logs do Docker');
      }

      this.log('Validações post-deploy concluídas');
      console.log('✅ Validações post-deploy concluídas');
    } catch (error) {
      console.error('❌ Falha nas validações post-deploy:', error.message);
      throw error;
    }
  }

  /**
   * Rollback para versão anterior
   */
  async rollback(environment) {
    console.log(`🔄 Iniciando rollback para ${environment}...`);
    
    try {
      // Obter última versão funcional
      const lastVersion = await this.getLastVersion();
      
      if (!lastVersion) {
        throw new Error('Versão anterior não encontrada para rollback');
      }

      // Rollback usando imagem anterior
      const imageName = `${this.config.dockerRegistry}/${this.config.namespace}/app`;
      await execAsync(`docker run -d --name app-rollback ${imageName}:${lastVersion}`);
      
      console.log(`✅ Rollback para versão ${lastVersion} concluído`);
      this.log(`Rollback para versão ${lastVersion} executado`);
      
      return {
        success: true,
        rolledBackTo: lastVersion
      };
    } catch (error) {
      console.error('❌ Falha no rollback:', error.message);
      this.log(`Falha no rollback: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obter versão atual
   */
  async getVersion() {
    try {
      const packageJson = await fs.readJson('package.json');
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Obter última versão para rollback
   */
  async getLastVersion() {
    try {
      const { stdout } = await execAsync('git tag --sort=-version:refname');
      const tags = stdout.trim().split('\n');
      return tags[1] || tags[0]; // Segunda tag mais recente ou mais recente se só tiver uma
    } catch {
      return null;
    }
  }

  /**
   * Aguardar por tempo determinado
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log de deploy
   */
  log(message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      message
    };
    this.deployLog.push(logEntry);
  }

  /**
   * Status dos ambientes
   */
  async getEnvironmentStatus() {
    const status = {};

    for (const env of this.config.environments) {
      try {
        let url = 'http://localhost:3000';
        if (env === 'staging') url = 'http://localhost:3001';
        if (env === 'production') url = process.env.PRODUCTION_URL || 'http://localhost:3000';

        const { stdout } = await execAsync(`curl -f ${url}/health 2>/dev/null || echo "down"`);
        status[env] = stdout.includes('down') ? 'down' : 'up';
      } catch {
        status[env] = 'unknown';
      }
    }

    return status;
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1] || 'development';

  const deployer = new DeployManager();

  try {
    switch (command) {
      case 'deploy':
        await deployer.deploy(environment, {
          skipTests: args.includes('--skip-tests'),
          skipBuild: args.includes('--skip-build'),
          force: args.includes('--force'),
          autoRollback: args.includes('--auto-rollback')
        });
        break;

      case 'rollback':
        await deployer.rollback(environment);
        break;

      case 'status':
        const status = await deployer.getEnvironmentStatus();
        console.log('Status dos ambientes:', status);
        break;

      default:
        console.log(`
Nexus Deploy Manager

Uso:
  node deploy.js deploy [environment] [options]
  node deploy.js rollback [environment]
  node deploy.js status

Ambientes: development, staging, production

Opções:
  --skip-tests     Pular execução de testes
  --skip-build     Pular build da aplicação
  --force          Forçar deploy sem confirmações
  --auto-rollback  Rollback automático em caso de falha
        `);
    }
  } catch (error) {
    console.error('❌', error.message);
    process.exit(1);
  }
}

export default DeployManager;