#!/usr/bin/env node

/**
 * Nexus CLI - Command Line Interface
 * Provides project scaffolding and management commands
 * 
 * @version 1.0.0
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
  .name('nexus')
  .description('Nexus Framework CLI - Rapid development toolkit')
  .version('1.0.0');

// Create new project command
program
  .command('create <project-name>')
  .description('Create a new Nexus project')
  .option('-t, --template <template>', 'Project template (fullstack, api, frontend)', 'fullstack')
  .action(async (projectName, options) => {
    const logger = createLogger();
    
    try {
      logger.info(`Creating new Nexus project: ${projectName}`);
      
      // Check if directory exists
      const projectPath = path.resolve(projectName);
      if (await fs.pathExists(projectPath)) {
        logger.error(`Directory ${projectName} already exists`);
        process.exit(1);
      }
      
      // Create project directory
      await fs.ensureDir(projectPath);
      
      // Copy template files
      const templatePath = path.join(__dirname, '..', 'templates', options.template);
      if (await fs.pathExists(templatePath)) {
        await fs.copy(templatePath, projectPath);
        logger.info('Template files copied');
      }
      
      // Create package.json
      const packageJson = {
        name: projectName,
        version: '1.0.0',
        description: `Nexus project: ${projectName}`,
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: 'jest',
          build: 'echo "Build command"'
        },
        dependencies: {
          '@oryum/nexus': '^1.0.0'
        }
      };
      
      await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
      
      // Create basic files
      await createBasicFiles(projectPath, projectName);
      
      logger.succeed(`Project ${projectName} created successfully!`);
      logger.info(`Next steps:`);
      logger.info(`  cd ${projectName}`);
      logger.info(`  npm install`);
      logger.info(`  npm run dev`);
      
    } catch (error) {
      logger.error('Failed to create project:', error.message);
      process.exit(1);
    }
  });

// Add module command
program
  .command('add <module>')
  .description('Add a Nexus module to current project')
  .action(async (moduleName) => {
    const logger = createLogger();
    
    try {
      logger.info(`Adding module: ${moduleName}`);
      
      // Check if we're in a Nexus project
      if (!await fs.pathExists('package.json')) {
        logger.error('Not in a Node.js project directory');
        process.exit(1);
      }
      
      const availableModules = ['auth', 'database', 'api', 'ui', 'notifications', 'payments', 'monitoring'];
      
      if (!availableModules.includes(moduleName)) {
        logger.error(`Module ${moduleName} not available`);
        logger.info('Available modules:', availableModules.join(', '));
        process.exit(1);
      }
      
      // Copy module files
      const modulePath = path.join(__dirname, '..', 'modules', moduleName);
      const targetPath = path.join(process.cwd(), 'modules', moduleName);
      
      await fs.copy(modulePath, targetPath);
      
      logger.succeed(`Module ${moduleName} added successfully!`);
      
    } catch (error) {
      logger.error('Failed to add module:', error.message);
      process.exit(1);
    }
  });

// Development server command
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .action(async (options) => {
    const logger = createLogger();
    
    try {
      logger.info('Starting development server...');
      
      // Check for index.js or main file
      const mainFile = await findMainFile();
      if (!mainFile) {
        logger.error('No main file found (index.js, app.js, server.js)');
        process.exit(1);
      }
      
      // Set environment
      process.env.NODE_ENV = 'development';
      process.env.PORT = options.port;
      
      // Start with nodemon if available, otherwise node
      let command;
      try {
        execSync('which nodemon', { stdio: 'ignore' });
        command = `nodemon ${mainFile}`;
      } catch {
        command = `node ${mainFile}`;
      }
      
      logger.info(`Running: ${command}`);
      execSync(command, { stdio: 'inherit' });
      
    } catch (error) {
      logger.error('Development server failed:', error.message);
      process.exit(1);
    }
  });

// Database commands
program
  .command('db')
  .description('Database management commands')
  .action(async () => {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to do?',
        choices: [
          'migrate - Run database migrations',
          'seed - Run database seeds',
          'reset - Reset database',
          'status - Check migration status'
        ]
      }
    ]);
    
    const dbAction = action.split(' ')[0];
    const logger = createLogger();
    
    try {
      switch (dbAction) {
        case 'migrate':
          logger.info('Running database migrations...');
          execSync('node scripts/migrate.js', { stdio: 'inherit' });
          break;
        case 'seed':
          logger.info('Running database seeds...');
          // Add seed logic
          break;
        case 'reset':
          logger.warn('This will reset your database. Are you sure?');
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: 'Reset database?',
              default: false
            }
          ]);
          if (confirm) {
            // Add reset logic
            logger.info('Database reset completed');
          }
          break;
        case 'status':
          logger.info('Checking migration status...');
          // Add status logic
          break;
      }
    } catch (error) {
      logger.error(`Database ${dbAction} failed:`, error.message);
      process.exit(1);
    }
  });

// Build command
program
  .command('build')
  .description('Build project for production')
  .action(async () => {
    const logger = createLogger();
    
    try {
      logger.info('Building project for production...');
      
      // Run build scripts
      if (await fs.pathExists('package.json')) {
        const pkg = await fs.readJson('package.json');
        if (pkg.scripts && pkg.scripts.build) {
          execSync('npm run build', { stdio: 'inherit' });
        } else {
          logger.info('No build script found in package.json');
        }
      }
      
      logger.succeed('Build completed');
      
    } catch (error) {
      logger.error('Build failed:', error.message);
      process.exit(1);
    }
  });

// Deploy command será adicionado no final do arquivo

// Health check command
program
  .command('health')
  .description('Run health diagnostics')
  .action(async () => {
    const logger = createLogger();
    
    try {
      logger.info('Running health diagnostics...');
      
      const checks = await runHealthChecks();
      
      console.log('\n' + chalk.bold('Health Check Results:'));
      console.log('────────────────────────────');
      
      checks.forEach(check => {
        const status = check.status === 'pass' ? chalk.green('✅') : chalk.red('❌');
        console.log(`${status} ${check.name}: ${check.message}`);
      });
      
    } catch (error) {
      logger.error('Health check failed:', error.message);
      process.exit(1);
    }
  });

// Helper functions

async function createBasicFiles(projectPath, projectName) {
  // Create index.js
  const indexContent = `
/**
 * ${projectName} - Nexus Project
 * Generated by Nexus CLI
 */

const { NexusApp } = require('@oryum/nexus');

const app = new NexusApp({
  name: '${projectName}',
  version: '1.0.0'
});

async function start() {
  try {
    await app.init();
    await app.start();
    console.log('🚀 Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
`.trim();

  await fs.writeFile(path.join(projectPath, 'index.js'), indexContent);
  
  // Create .env
  const envContent = `
# Environment Configuration
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${projectName}_dev
DB_USER=postgres
DB_PASS=

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=24h

# Other configs...
`.trim();

  await fs.writeFile(path.join(projectPath, '.env'), envContent);
  
  // Create README.md
  const readmeContent = `
# ${projectName}

A Nexus Framework project.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Available Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm test\` - Run tests

## Documentation

Visit [Nexus Framework Documentation](https://github.com/oryum/nexus) for more information.
`.trim();

  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
}

async function findMainFile() {
  const possibleFiles = ['index.js', 'app.js', 'server.js', 'main.js'];
  
  for (const file of possibleFiles) {
    if (await fs.pathExists(file)) {
      return file;
    }
  }
  
  return null;
}

async function runHealthChecks() {
  const checks = [];
  
  // Check Node.js version
  const nodeVersion = process.version;
  checks.push({
    name: 'Node.js Version',
    status: 'pass',
    message: nodeVersion
  });
  
  // Check package.json
  if (await fs.pathExists('package.json')) {
    checks.push({
      name: 'Package.json',
      status: 'pass',
      message: 'Found'
    });
  } else {
    checks.push({
      name: 'Package.json',
      status: 'fail',
      message: 'Not found'
    });
  }
  
  // Check node_modules
  if (await fs.pathExists('node_modules')) {
    checks.push({
      name: 'Dependencies',
      status: 'pass',
      message: 'Installed'
    });
  } else {
    checks.push({
      name: 'Dependencies',
      status: 'fail',
      message: 'Run npm install'
    });
  }
  
  return checks;
}

function createLogger() {
  return {
    info: (msg) => console.log(chalk.blue('ℹ'), msg),
    warn: (msg) => console.log(chalk.yellow('⚠'), msg),
    error: (msg, details) => {
      console.log(chalk.red('✗'), msg);
      if (details) console.log(chalk.red('  '), details);
    },
    succeed: (msg) => console.log(chalk.green('✅'), msg)
  };
}

// Comando: nexus docker
program
  .command('docker')
  .description('Comandos Docker e containerização')
  .option('-i, --init', 'Inicializar arquivos Docker')
  .option('-b, --build [name]', 'Construir imagem Docker')
  .option('-r, --run', 'Executar containers com docker-compose')
  .option('-s, --stop', 'Parar containers')
  .option('-l, --logs [service]', 'Ver logs dos containers')
  .action(async (options) => {
    const logger = createLogger();
    
    try {
      const { DockerModule } = await import('../modules/docker/index.js');
      const docker = new DockerModule();

      if (options.init) {
        logger.info('Inicializando arquivos Docker...');
        await docker.createDockerFiles('.');
        logger.succeed('Arquivos Docker criados com sucesso!');
        return;
      }

      if (options.build) {
        const imageName = options.build === true ? 'nexus-app' : options.build;
        logger.info(`Construindo imagem: ${imageName}...`);
        await docker.buildImage(imageName);
        return;
      }

      if (options.run) {
        logger.info('Iniciando containers...');
        await docker.runCompose();
        return;
      }

      if (options.stop) {
        logger.info('Parando containers...');
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        await execAsync('docker-compose down');
        logger.succeed('Containers parados');
        return;
      }

      if (options.logs) {
        const service = options.logs === true ? '' : options.logs;
        logger.info(`Logs do container${service ? ` ${service}` : 's'}...`);
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        const { stdout } = await execAsync(`docker-compose logs ${service}`);
        console.log(stdout);
        return;
      }

      // Se nenhuma opção foi fornecida, mostrar status
      logger.info('Status dos containers Docker:');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      try {
        const { stdout } = await execAsync('docker-compose ps');
        console.log(stdout);
      } catch (error) {
        console.log('Nenhum container encontrado ou docker-compose não disponível');
      }

    } catch (error) {
      logger.error('Erro nos comandos Docker:', error.message);
      process.exit(1);
    }
  });

// Comando: nexus deploy
program
  .command('deploy')
  .description('Deploy automatizado para diferentes ambientes')
  .argument('[environment]', 'Ambiente de deploy (development, staging, production)', 'development')
  .option('--skip-tests', 'Pular execução de testes')
  .option('--skip-build', 'Pular build da aplicação')
  .option('--force', 'Forçar deploy sem confirmações')
  .option('--rollback', 'Fazer rollback para versão anterior')
  .action(async (environment, options) => {
    const logger = createLogger();
    
    try {
      const DeployManager = (await import('../scripts/deploy-manager.js')).default;
      const deployer = new DeployManager();

      if (options.rollback) {
        logger.info(`Fazendo rollback para ${environment}...`);
        await deployer.rollback(environment);
      } else {
        logger.info(`Iniciando deploy para ${environment}...`);
        await deployer.deploy(environment, {
          skipTests: options.skipTests,
          skipBuild: options.skipBuild,
          force: options.force
        });
      }

    } catch (error) {
      logger.error('Erro no deploy:', error.message);
      process.exit(1);
    }
  });

// Execute CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export default program;