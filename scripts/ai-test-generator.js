#!/usr/bin/env node

/**
 * Gerador automático de testes usando IA
 * Analisa código e gera testes unitários completos
 */

import { AIModule } from '../modules/ai/index.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AITestGenerator {
  constructor() {
    this.ai = new AIModule();
    this.projectRoot = path.join(__dirname, '..');
  }

  async generate(targetPath = null) {
    console.log('🤖 Gerando testes automaticamente com IA...\n');

    const filesToTest = targetPath 
      ? [targetPath] 
      : await this.findJavaScriptFiles();

    for (const filePath of filesToTest) {
      try {
        await this.generateTestForFile(filePath);
      } catch (error) {
        console.error(`❌ Erro ao gerar teste para ${filePath}:`, error.message);
      }
    }

    console.log('\n✅ Geração de testes concluída!');
  }

  async findJavaScriptFiles() {
    const files = [];
    const searchPaths = [
      'modules',
      'src',
      'server',
      'lib'
    ];

    for (const searchPath of searchPaths) {
      const fullPath = path.join(this.projectRoot, searchPath);
      
      if (await fs.pathExists(fullPath)) {
        const foundFiles = await this.scanDirectory(fullPath);
        files.push(...foundFiles);
      }
    }

    return files.filter(file => 
      file.endsWith('.js') && 
      !file.includes('test') && 
      !file.includes('spec') &&
      !file.includes('node_modules')
    );
  }

  async scanDirectory(dirPath) {
    const files = [];
    const items = await fs.readdir(dirPath);

    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = await fs.stat(fullPath);

      if (stat.isDirectory()) {
        const subFiles = await this.scanDirectory(fullPath);
        files.push(...subFiles);
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  async generateTestForFile(filePath) {
    console.log(`📝 Gerando teste para: ${path.relative(this.projectRoot, filePath)}`);

    // Ler código do arquivo
    const code = await fs.readFile(filePath, 'utf8');
    
    // Detectar framework de teste (Jest por padrão)
    const framework = await this.detectTestFramework();
    
    // Gerar teste com IA
    const result = await this.ai.generateTests(code, framework);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    // Salvar arquivo de teste
    await this.saveTestFile(filePath, result.tests);
    
    console.log(`✅ Teste gerado para: ${path.basename(filePath)}`);
  }

  async detectTestFramework() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps.vitest) return 'vitest';
      if (deps.mocha) return 'mocha';
      if (deps.jasmine) return 'jasmine';
    }
    
    return 'jest'; // padrão
  }

  async saveTestFile(originalFilePath, testCode) {
    const relativePath = path.relative(this.projectRoot, originalFilePath);
    const parsedPath = path.parse(relativePath);
    
    // Determinar caminho do arquivo de teste
    let testPath;
    if (parsedPath.dir.includes('modules')) {
      // Para módulos, colocar teste na mesma pasta
      testPath = path.join(
        this.projectRoot,
        parsedPath.dir,
        `${parsedPath.name}.test.js`
      );
    } else {
      // Para outros arquivos, usar pasta tests
      testPath = path.join(
        this.projectRoot,
        'tests',
        parsedPath.dir,
        `${parsedPath.name}.test.js`
      );
    }

    // Criar diretório se não existir
    await fs.ensureDir(path.dirname(testPath));

    // Adicionar header ao arquivo de teste
    const testHeader = `/**
 * Testes gerados automaticamente para ${path.basename(originalFilePath)}
 * Gerado em: ${new Date().toISOString()}
 * Framework: Jest
 */

`;

    const finalTestCode = testHeader + testCode;

    // Salvar arquivo
    await fs.writeFile(testPath, finalTestCode);
  }

  async generateTestSuite() {
    console.log('🧪 Gerando suite completa de testes...\n');

    // Gerar testes para todos os módulos
    const modulePaths = [
      'modules/auth/index.js',
      'modules/database/index.js',
      'modules/ui/index.js',
      'modules/ai/index.js',
      'modules/monitoring/index.js'
    ];

    for (const modulePath of modulePaths) {
      const fullPath = path.join(this.projectRoot, modulePath);
      
      if (await fs.pathExists(fullPath)) {
        await this.generateTestForFile(fullPath);
      }
    }

    // Gerar configuração de teste
    await this.generateTestConfig();
    
    // Gerar script de teste de integração
    await this.generateIntegrationTests();

    console.log('\n🎯 Suite de testes completa gerada!');
  }

  async generateTestConfig() {
    const jestConfig = {
      testEnvironment: 'node',
      collectCoverage: true,
      coverageDirectory: 'coverage',
      collectCoverageFrom: [
        'modules/**/*.js',
        'src/**/*.js',
        '!**/*.test.js',
        '!**/node_modules/**'
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      testMatch: [
        '**/__tests__/**/*.js',
        '**/*.test.js',
        '**/*.spec.js'
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
    };

    await fs.writeJson(
      path.join(this.projectRoot, 'jest.config.json'),
      jestConfig,
      { spaces: 2 }
    );

    // Gerar arquivo de setup
    const setupContent = `/**
 * Configuração global de testes Jest
 */

// Configurar timeout global
jest.setTimeout(30000);

// Mock console.log em testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

// Setup global antes de todos os testes
beforeAll(() => {
  console.log('🧪 Iniciando suite de testes...');
});

// Cleanup após todos os testes
afterAll(() => {
  console.log('✅ Testes concluídos!');
});
`;

    await fs.ensureDir(path.join(this.projectRoot, 'tests'));
    await fs.writeFile(
      path.join(this.projectRoot, 'tests/setup.js'),
      setupContent
    );
  }

  async generateIntegrationTests() {
    const integrationTest = `/**
 * Testes de integração do Oryum Nexus
 * Testa a integração entre módulos
 */

import { AuthModule } from '../modules/auth/index.js';
import { DatabaseModule } from '../modules/database/index.js';
import { MonitoringModule } from '../modules/monitoring/index.js';

describe('Nexus Integration Tests', () => {
  let auth, database, monitoring;

  beforeAll(async () => {
    // Inicializar módulos
    auth = new AuthModule();
    database = new DatabaseModule();
    monitoring = new MonitoringModule();
  });

  describe('Módulos Health Check', () => {
    test('Auth module should be healthy', async () => {
      const health = await auth.healthCheck();
      expect(health.status).toBe('healthy');
    });

    test('Database module should be healthy', async () => {
      const health = await database.healthCheck();
      expect(health).toBeDefined();
    });

    test('Monitoring module should be healthy', () => {
      const health = monitoring.healthCheck();
      expect(health.status).toBe('healthy');
    });
  });

  describe('Módulos Integration', () => {
    test('Auth and Database integration', async () => {
      // Testar criação de usuário via auth que salva no database
      const testUser = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Simular processo de registro
      const result = await auth.register(testUser.email, testUser.password);
      expect(result.success).toBe(true);
    });

    test('Monitoring logs integration', () => {
      // Testar se monitoring captura logs corretamente
      monitoring.log('info', 'Integration test log');
      
      const metrics = monitoring.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('End-to-End Scenarios', () => {
    test('Complete user journey', async () => {
      // 1. Registrar usuário
      const registerResult = await auth.register('e2e@test.com', 'pass123');
      expect(registerResult.success).toBe(true);

      // 2. Fazer login
      const loginResult = await auth.login('e2e@test.com', 'pass123');
      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBeDefined();

      // 3. Verificar logs
      const metrics = monitoring.getMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });
  });
});
`;

    await fs.writeFile(
      path.join(this.projectRoot, 'tests/integration.test.js'),
      integrationTest
    );
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new AITestGenerator();
  
  const command = process.argv[2];
  const target = process.argv[3];

  if (command === 'suite') {
    generator.generateTestSuite().catch(console.error);
  } else {
    generator.generate(target).catch(console.error);
  }
}

export default AITestGenerator;