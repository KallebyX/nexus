#!/usr/bin/env node

/**
 * CLI para criação de projetos Oryum Nexus
 * Cria estrutura completa de projeto com módulos selecionados
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectCreator {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
  }

  async create() {
    console.log(chalk.blue.bold('\n🚀 Oryum Nexus Project Creator\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Nome do projeto:',
        validate: (input) => {
          if (!input) return 'Nome do projeto é obrigatório';
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Use apenas letras, números, hífens e underscores';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Descrição do projeto:',
        default: 'Projeto criado com Oryum Nexus'
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'Tipo de projeto:',
        choices: [
          { name: '🌐 Full Stack (Frontend + Backend)', value: 'fullstack' },
          { name: '⚛️  Frontend Only (React + Next.js)', value: 'frontend' },
          { name: '🔧 Backend Only (Node.js + Express)', value: 'backend' },
          { name: '🔨 Microserviço', value: 'microservice' }
        ]
      },
      {
        type: 'checkbox',
        name: 'modules',
        message: 'Selecione os módulos:',
        choices: [
          { name: '🔐 Autenticação (JWT, OAuth)', value: 'auth', checked: true },
          { name: '📊 Database (Supabase/PostgreSQL)', value: 'database', checked: true },
          { name: '🎨 UI Components (React)', value: 'ui', checked: true },
          { name: '🤖 IA Integration (OpenAI)', value: 'ai' },
          { name: '💳 Payments (Stripe)', value: 'payments' },
          { name: '📨 Notifications', value: 'notifications' },
          { name: '📈 Monitoring & Logs', value: 'monitoring', checked: true },
          { name: '🧪 Testing Suite', value: 'testing', checked: true }
        ]
      },
      {
        type: 'list',
        name: 'deployment',
        message: 'Plataforma de deploy:',
        choices: [
          { name: '▲ Vercel', value: 'vercel' },
          { name: '🚀 Render', value: 'render' },
          { name: '🏠 VPS/Docker', value: 'vps' },
          { name: '☁️  AWS/Azure', value: 'cloud' }
        ]
      },
      {
        type: 'confirm',
        name: 'setupCI',
        message: 'Configurar CI/CD automaticamente?',
        default: true
      }
    ]);

    await this.generateProject(answers);
  }

  async generateProject(config) {
    const projectPath = path.join(process.cwd(), config.projectName);
    
    console.log(chalk.yellow(`\n📁 Criando projeto em: ${projectPath}\n`));

    // Criar diretório do projeto
    await fs.ensureDir(projectPath);

    // Copiar template base
    await this.copyTemplate(config.projectType, projectPath);

    // Gerar package.json
    await this.generatePackageJson(config, projectPath);

    // Gerar nexus.config.js
    await this.generateNexusConfig(config, projectPath);

    // Copiar módulos selecionados
    await this.copyModules(config.modules, projectPath);

    // Configurar CI/CD
    if (config.setupCI) {
      await this.setupCI(config, projectPath);
    }

    // Gerar README
    await this.generateReadme(config, projectPath);

    // Gerar .env.example
    await this.generateEnvExample(config, projectPath);

    console.log(chalk.green.bold('\n✅ Projeto criado com sucesso!\n'));
    console.log(chalk.cyan('Próximos passos:'));
    console.log(chalk.white(`  cd ${config.projectName}`));
    console.log(chalk.white('  npm install'));
    console.log(chalk.white('  cp .env.example .env'));
    console.log(chalk.white('  npm run dev\n'));
  }

  async copyTemplate(type, projectPath) {
    const templatePath = path.join(this.templatesPath, type);
    
    if (await fs.pathExists(templatePath)) {
      await fs.copy(templatePath, projectPath);
    } else {
      // Criar estrutura básica se template não existir
      await this.createBasicStructure(projectPath, type);
    }
  }

  async createBasicStructure(projectPath, type) {
    const structure = {
      fullstack: ['src', 'server', 'public', 'docs'],
      frontend: ['src', 'components', 'pages', 'public', 'styles'],
      backend: ['src', 'routes', 'models', 'middleware', 'tests'],
      microservice: ['src', 'services', 'config', 'tests']
    };

    for (const dir of structure[type] || []) {
      await fs.ensureDir(path.join(projectPath, dir));
    }
  }

  async generatePackageJson(config, projectPath) {
    const packageJson = {
      name: config.projectName,
      version: '1.0.0',
      description: config.description,
      main: 'index.js',
      scripts: {
        dev: 'npm run dev:all',
        'dev:frontend': 'next dev',
        'dev:backend': 'nodemon server/index.js',
        'dev:all': 'concurrently "npm run dev:frontend" "npm run dev:backend"',
        build: 'next build',
        start: 'next start',
        test: 'jest',
        'test:watch': 'jest --watch',
        lint: 'eslint . --ext .js,.jsx,.ts,.tsx',
        'ai:docs': 'node scripts/ai-docs.js',
        'health:check': 'node scripts/health-check.js'
      },
      dependencies: {
        '@oryum/nexus': '^1.0.0'
      },
      devDependencies: {
        'eslint': '^8.0.0',
        'jest': '^29.0.0',
        'nodemon': '^3.0.0',
        'concurrently': '^8.0.0'
      },
      keywords: ['nexus', 'oryum', ...config.modules],
      author: '',
      license: 'MIT'
    };

    // Adicionar dependências específicas dos módulos
    if (config.modules.includes('auth')) {
      packageJson.dependencies['jsonwebtoken'] = '^9.0.0';
      packageJson.dependencies['@supabase/supabase-js'] = '^2.0.0';
    }

    if (config.modules.includes('ui')) {
      packageJson.dependencies['react'] = '^18.0.0';
      packageJson.dependencies['next'] = '^14.0.0';
      packageJson.dependencies['tailwindcss'] = '^3.0.0';
    }

    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
  }

  async generateNexusConfig(config, projectPath) {
    const nexusConfig = {
      project: {
        name: config.projectName,
        type: config.projectType
      },
      modules: {},
      deploy: {
        provider: config.deployment
      }
    };

    // Configurar módulos
    config.modules.forEach(module => {
      nexusConfig.modules[module] = { enabled: true };
    });

    const configContent = `export default ${JSON.stringify(nexusConfig, null, 2)};`;
    await fs.writeFile(path.join(projectPath, 'nexus.config.js'), configContent);
  }

  async copyModules(modules, projectPath) {
    for (const module of modules) {
      const modulePath = path.join(__dirname, '../modules', module);
      const targetPath = path.join(projectPath, 'modules', module);
      
      if (await fs.pathExists(modulePath)) {
        await fs.copy(modulePath, targetPath);
      }
    }
  }

  async setupCI(config, projectPath) {
    const ciPath = path.join(projectPath, '.github', 'workflows');
    await fs.ensureDir(ciPath);
    
    const ciConfig = path.join(__dirname, '../.github/workflows/ci-cd.yml');
    if (await fs.pathExists(ciConfig)) {
      await fs.copy(ciConfig, path.join(ciPath, 'ci-cd.yml'));
    }
  }

  async generateReadme(config, projectPath) {
    const readme = `# ${config.projectName}

${config.description}

## Tecnologias

- Oryum Nexus Framework
- Módulos: ${config.modules.join(', ')}
- Deploy: ${config.deployment}

## Instalação

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## Comandos

- \`npm run dev\` - Desenvolvimento
- \`npm run build\` - Build
- \`npm test\` - Testes
- \`npm run ai:docs\` - Gerar documentação

## Licença

MIT
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);
  }

  async generateEnvExample(config, projectPath) {
    let envContent = `# ${config.projectName} Environment Variables\n\n# Database\nSUPABASE_URL=\nSUPABASE_ANON_KEY=\nSUPABASE_SERVICE_KEY=\n\n# JWT\nJWT_SECRET=\n\n`;

    if (config.modules.includes('ai')) {
      envContent += '# AI Integration\nOPENAI_API_KEY=\n\n';
    }

    if (config.modules.includes('payments')) {
      envContent += '# Payments\nSTRIPE_SECRET_KEY=\nSTRIPE_PUBLISHABLE_KEY=\n\n';
    }

    await fs.writeFile(path.join(projectPath, '.env.example'), envContent);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const creator = new ProjectCreator();
  creator.create().catch(console.error);
}

export default ProjectCreator;