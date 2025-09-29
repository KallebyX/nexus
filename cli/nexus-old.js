#!/usr/bin/env node

/**
 * Nexus CLI - Command Line Interface
 * Framework Nexus - Oryum
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { initializeDatabase } from '../modules/database/index.js';

const program = new Command();

// ASCII Art Banner
const banner = `
${chalk.cyan(`
███╗   ██╗███████╗██╗  ██╗██╗   ██╗███╗   ██╗
████╗  ██║██╔════╝╚██╗██╔╝██║   ██║████╗  ██║
██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║██╔██╗ ██║
██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║██║╚██╗██║
██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝██║ ╚████║
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
`)}
${chalk.yellow('Framework Modular para Desenvolvimento Rápido')}
${chalk.gray('v1.0.0 - Oryum Technology')}
`;

program
  .name('nexus')
  .description(banner)
  .version('1.0.0');

// Create new project
program
  .command('create <project-name>')
  .description('Criar novo projeto Nexus')
  .option('-t, --template <template>', 'Template do projeto', 'fullstack')
  .option('-d, --database <db>', 'Tipo de database', 'postgresql')
  .option('--no-auth', 'Não incluir módulo de autenticação')
  .option('--no-ui', 'Não incluir componentes UI')
  .action(async (projectName, options) => {
    try {
      console.log(banner);
      console.log(chalk.green(`🚀 Criando projeto: ${projectName}\n`));
      
      const projectPath = path.join(process.cwd(), projectName);
      
      // Verificar se diretório já existe
      if (await fs.pathExists(projectPath)) {
        console.log(chalk.red(`❌ Diretório ${projectName} já existe`));
        return;
      }
      
      // Criar estrutura do projeto
      await createProjectStructure(projectPath, projectName, options);
      
      console.log(chalk.green('\n✅ Projeto criado com sucesso!'));
      console.log(chalk.cyan('\n📝 Próximos passos:'));
      console.log(chalk.gray(`   cd ${projectName}`));
      console.log(chalk.gray('   npm install'));
      console.log(chalk.gray('   nexus dev'));
      
    } catch (error) {
      console.error(chalk.red('❌ Erro ao criar projeto:'), error.message);
    }
  });

// Add module to existing project
program
  .command('add <module>')
  .description('Adicionar módulo ao projeto')
  .action(async (module) => {
    try {
      console.log(chalk.green(`📦 Adicionando módulo: ${module}`));
      
      const availableModules = [
        'auth', 'database', 'api', 'ui', 'payments', 
        'notifications', 'monitoring', 'testing'
      ];
      
      if (!availableModules.includes(module)) {
        console.log(chalk.red(`❌ Módulo '${module}' não disponível`));
        console.log(chalk.gray('Módulos disponíveis:'), availableModules.join(', '));
        return;
      }
      
      await addModuleToProject(module);
      
      console.log(chalk.green(`✅ Módulo ${module} adicionado com sucesso!`));
      
    } catch (error) {
      console.error(chalk.red('❌ Erro ao adicionar módulo:'), error.message);
    }
  });

// Development server
program
  .command('dev')
  .description('Iniciar servidor de desenvolvimento')
  .option('-p, --port <port>', 'Porta do servidor', '3001')
  .option('--no-db', 'Não inicializar banco de dados')
  .option('--watch', 'Watch mode com hot reload')
  .action(async (options) => {
    try {
      console.log(chalk.green('🔥 Iniciando servidor de desenvolvimento...\n'));
      
      // Verificar se é um projeto Nexus
      if (!await isNexusProject()) {
        console.log(chalk.red('❌ Este não é um projeto Nexus válido'));
        return;
      }
      
      await startDevServer(options);
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no servidor de desenvolvimento:'), error.message);
    }
  });

// Database operations
program
  .command('db')
  .description('Operações de banco de dados')
  .addCommand(
    new Command('migrate')
      .description('Executar migrações do banco')
      .option('--reset', 'Reset completo do banco')
      .action(async (options) => {
        try {
          console.log(chalk.green('🗄️  Executando migrações...'));
          await runMigrations(options.reset);
          console.log(chalk.green('✅ Migrações concluídas!'));
        } catch (error) {
          console.error(chalk.red('❌ Erro nas migrações:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('seed')
      .description('Popular banco com dados de exemplo')
      .action(async () => {
        try {
          console.log(chalk.green('🌱 Populando banco de dados...'));
          await runSeeders();
          console.log(chalk.green('✅ Dados de exemplo criados!'));
        } catch (error) {
          console.error(chalk.red('❌ Erro ao popular banco:'), error.message);
        }
      })
  )
  .addCommand(
    new Command('status')
      .description('Status do banco de dados')
      .action(async () => {
        try {
          await checkDatabaseStatus();
        } catch (error) {
          console.error(chalk.red('❌ Erro ao verificar status:'), error.message);
        }
      })
  );

// Build for production
program
  .command('build')
  .description('Build para produção')
  .option('--no-minify', 'Não minificar assets')
  .option('--analyze', 'Analisar bundle size')
  .action(async (options) => {
    try {
      console.log(chalk.green('📦 Iniciando build de produção...\n'));
      await buildForProduction(options);
      console.log(chalk.green('✅ Build concluído!'));
    } catch (error) {
      console.error(chalk.red('❌ Erro no build:'), error.message);
    }
  });

// Health check
program
  .command('health')
  .description('Diagnóstico do projeto')
  .option('--verbose', 'Saída detalhada')
  .action(async (options) => {
    try {
      console.log(chalk.green('🏥 Executando diagnóstico...\n'));
      await healthCheck(options.verbose);
    } catch (error) {
      console.error(chalk.red('❌ Erro no diagnóstico:'), error.message);
    }
  });

// Deploy
program
  .command('deploy <environment>')
  .description('Deploy para ambiente específico')
  .option('--dry-run', 'Simular deploy sem executar')
  .action(async (environment, options) => {
    try {
      console.log(chalk.green(`🚀 Deploy para ${environment}...\n`));
      
      const validEnvs = ['staging', 'production'];
      if (!validEnvs.includes(environment)) {
        console.log(chalk.red(`❌ Ambiente inválido. Use: ${validEnvs.join(', ')}`));
        return;
      }
      
      await deployToEnvironment(environment, options);
      
    } catch (error) {
      console.error(chalk.red('❌ Erro no deploy:'), error.message);
    }
  });

// Helper functions
async function createProjectStructure(projectPath, projectName, options) {
  const spinner = createSpinner('Criando estrutura do projeto...');
  
  // Criar diretórios base
  const dirs = [
    'src/components',
    'src/pages',
    'src/services',
    'src/utils',
    'public',
    'docs',
    'tests'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }
  
  // Copiar módulos selecionados
  const modulesToCopy = ['database'];
  if (options.auth !== false) modulesToCopy.push('auth');
  if (options.ui !== false) modulesToCopy.push('ui');
  
  const modulesPath = path.join(projectPath, 'modules');
  await fs.ensureDir(modulesPath);
  
  for (const module of modulesToCopy) {
    const sourcePath = path.join(__dirname, '..', 'modules', module);
    const destPath = path.join(modulesPath, module);
    await fs.copy(sourcePath, destPath);
  }
  
  // Criar package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    description: `Projeto ${projectName} criado com Nexus Framework`,
    main: 'src/index.js',
    scripts: {
      dev: 'nexus dev',
      build: 'nexus build',
      start: 'node src/index.js',
      test: 'nexus test',
      'db:migrate': 'nexus db migrate',
      'db:seed': 'nexus db seed'
    },
    dependencies: {
      '@oryum/nexus': '^1.0.0',
      express: '^4.18.0',
      cors: '^2.8.5',
      helmet: '^7.0.0',
      'express-rate-limit': '^6.0.0'
    },
    devDependencies: {
      nodemon: '^3.0.0'
    }
  };
  
  if (options.database === 'postgresql') {
    packageJson.dependencies.sequelize = '^6.0.0';
    packageJson.dependencies.pg = '^8.0.0';
  }
  
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  
  // Criar arquivos de configuração
  await createConfigFiles(projectPath, options);
  
  // Criar arquivo principal
  await createMainFile(projectPath, options);
  
  spinner.succeed('Estrutura criada');
}

async function createConfigFiles(projectPath, options) {
  // .env.example
  const envExample = `
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/${path.basename(projectPath)}_dev
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# API
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
`.trim();
  
  await fs.writeFile(path.join(projectPath, '.env.example'), envExample);
  
  // nexus.config.js
  const nexusConfig = `
export default {
  database: {
    provider: '${options.database}',
    migrations: true,
    seeds: true
  },
  auth: {
    enabled: ${options.auth !== false},
    providers: ['local'],
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d'
    }
  },
  api: {
    port: process.env.PORT || 3001,
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']
    }
  },
  ui: {
    enabled: ${options.ui !== false},
    theme: 'default'
  }
};
`.trim();
  
  await fs.writeFile(path.join(projectPath, 'nexus.config.js'), nexusConfig);
}

async function createMainFile(projectPath, options) {
  const mainFile = `
/**
 * ${path.basename(projectPath)} - Aplicação Nexus
 * Gerado automaticamente pelo Nexus CLI
 */

import { initializeDatabase } from './modules/database/index.js';
import { initializeApi } from './modules/api/index.js';
${options.auth !== false ? "import { initializeAuthModule } from './modules/auth/index.js';" : ''}

async function startApp() {
  try {
    console.log('🚀 Inicializando ${path.basename(projectPath)}...');
    
    // Inicializar módulos
    const db = await initializeDatabase();
    ${options.auth !== false ? 'const auth = await initializeAuthModule();' : ''}
    
    // Sincronizar banco em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      await db.syncDatabase();
    }
    
    // Inicializar API
    const api = await initializeApi({
      port: process.env.PORT || 3001
    });
    
    await api.start();
    
    console.log('✅ Aplicação iniciada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao iniciar aplicação:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Desligando aplicação...');
  process.exit(0);
});

startApp();
`.trim();
  
  await fs.writeFile(path.join(projectPath, 'src/index.js'), mainFile);
}

async function isNexusProject() {
  try {
    const packageJson = await fs.readJson('package.json');
    return packageJson.dependencies?.['@oryum/nexus'] || 
           await fs.pathExists('nexus.config.js') ||
           await fs.pathExists('modules');
  } catch {
    return false;
  }
}

async function runMigrations(reset = false) {
  const db = await initializeDatabase();
  await db.syncDatabase(reset);
}

async function checkDatabaseStatus() {
  try {
    const db = await initializeDatabase();
    const health = await db.healthCheck();
    
    console.log(chalk.green('📊 Status do Banco de Dados:\n'));
    console.log('Status:', health.status === 'healthy' ? 
      chalk.green('✅ Saudável') : chalk.red('❌ Com problemas'));
    console.log('PostgreSQL:', health.postgres ? 
      chalk.green('✅ Conectado') : chalk.red('❌ Desconectado'));
    console.log('Redis:', health.redis ? 
      chalk.green('✅ Conectado') : chalk.yellow('⚠️ Opcional'));
    console.log('Modelos:', chalk.blue(health.models), 'registrados');
    console.log('Timestamp:', chalk.gray(health.timestamp));
    
  } catch (error) {
    console.log(chalk.red('❌ Erro ao conectar com banco:'), error.message);
  }
}

function createSpinner(text) {
  // Implementação simples de spinner
  return {
    succeed: (msg) => console.log(chalk.green('✅'), msg)
  };
}

// Execute CLI
if (require.main === module) {
  program.parse();
}

module.exports = program;
`.trim();

  await fs.writeFile(path.join(projectPath, 'src/index.js'), mainFile);
}

// Funções auxiliares continuarão sendo implementadas...

export { program };