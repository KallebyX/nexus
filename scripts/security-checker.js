#!/usr/bin/env node

/**
 * Checklist de Segurança - Oryum Nexus
 * Auditoria automatizada de segurança para projetos
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SecurityChecker {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.issues = [];
    this.checks = [];
  }

  async runAudit() {
    console.log('🔐 Iniciando auditoria de segurança do Nexus...\n');

    // Registrar todos os checks
    this.registerChecks();

    // Executar checks
    for (const check of this.checks) {
      try {
        console.log(`🔍 Verificando: ${check.name}`);
        await check.run();
      } catch (error) {
        this.addIssue('error', check.name, `Erro na verificação: ${error.message}`);
      }
    }

    // Gerar relatório
    this.generateReport();
  }

  registerChecks() {
    this.checks = [
      { name: 'Configurações JWT', run: () => this.checkJWTConfig() },
      { name: 'Variáveis de Ambiente', run: () => this.checkEnvironmentVariables() },
      { name: 'Dependências Vulneráveis', run: () => this.checkVulnerableDependencies() },
      { name: 'Headers de Segurança', run: () => this.checkSecurityHeaders() },
      { name: 'Validação de Entrada', run: () => this.checkInputValidation() },
      { name: 'Rate Limiting', run: () => this.checkRateLimiting() },
      { name: 'Logs de Auditoria', run: () => this.checkAuditLogs() },
      { name: 'HTTPS/TLS', run: () => this.checkHTTPS() },
      { name: 'Sanitização XSS', run: () => this.checkXSS() },
      { name: 'SQL Injection Protection', run: () => this.checkSQLInjection() },
      { name: 'Configurações CORS', run: () => this.checkCORS() },
      { name: 'Secrets em Código', run: () => this.checkHardcodedSecrets() }
    ];
  }

  async checkJWTConfig() {
    // Verificar se JWT_SECRET está configurado
    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, '.env.example');

    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      if (!envContent.includes('JWT_SECRET=') || envContent.includes('JWT_SECRET=\n')) {
        this.addIssue('high', 'JWT Secret', 'JWT_SECRET não configurado ou vazio');
      } else {
        const jwtMatch = envContent.match(/JWT_SECRET=(.+)/);
        if (jwtMatch && jwtMatch[1].length < 32) {
          this.addIssue('medium', 'JWT Secret', 'JWT_SECRET muito simples (use pelo menos 32 caracteres)');
        }
      }
    } else {
      this.addIssue('high', 'Environment', 'Arquivo .env não encontrado');
    }

    // Verificar auth module
    const authPath = path.join(this.projectRoot, 'modules/auth/index.js');
    if (await fs.pathExists(authPath)) {
      const authContent = await fs.readFile(authPath, 'utf8');
      
      if (authContent.includes('expiresIn') && authContent.includes('24h')) {
        // Token muito longo
        this.addIssue('low', 'JWT Expiration', 'Token JWT com expiração muito longa (24h)');
      }
    }
  }

  async checkEnvironmentVariables() {
    const sensitiveVars = [
      'JWT_SECRET',
      'SUPABASE_SERVICE_KEY',
      'OPENAI_API_KEY',
      'STRIPE_SECRET_KEY',
      'DATABASE_PASSWORD'
    ];

    const envExamplePath = path.join(this.projectRoot, '.env.example');
    
    if (await fs.pathExists(envExamplePath)) {
      const content = await fs.readFile(envExamplePath, 'utf8');
      
      for (const varName of sensitiveVars) {
        if (content.includes(`${varName}=`) && !content.includes(`${varName}=\n`)) {
          // Verificar se há valor real no .env.example
          const match = content.match(new RegExp(`${varName}=(.+)`));
          if (match && match[1].trim() && !match[1].includes('your_') && !match[1].includes('xxx')) {
            this.addIssue('high', 'Environment', `Possível secret exposto em .env.example: ${varName}`);
          }
        }
      }
    }
  }

  async checkVulnerableDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Lista de pacotes conhecidamente vulneráveis ou desatualizados
      const vulnerablePackages = {
        'lodash': '^4.17.20', // versões antigas têm vulnerabilidades
        'moment': '*', // moment está deprecated
        'request': '*', // request está deprecated
        'node-uuid': '*' // usar uuid instead
      };

      for (const [pkg, version] of Object.entries(allDeps)) {
        if (vulnerablePackages[pkg]) {
          this.addIssue('medium', 'Dependencies', `Pacote potencialmente vulnerável: ${pkg}@${version}`);
        }
      }
    }
  }

  async checkSecurityHeaders() {
    // Verificar se helmet está configurado
    const serverFiles = [
      'server/index.js',
      'index.js',
      'app.js',
      'examples/backend-api.js'
    ];

    let helmetFound = false;

    for (const file of serverFiles) {
      const filePath = path.join(this.projectRoot, file);
      
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        
        if (content.includes('helmet')) {
          helmetFound = true;
          
          // Verificar configuração adequada
          if (!content.includes('helmet()') && !content.includes('helmet({')) {
            this.addIssue('medium', 'Security Headers', 'Helmet importado mas não usado');
          }
        }
      }
    }

    if (!helmetFound) {
      this.addIssue('medium', 'Security Headers', 'Helmet não encontrado - headers de segurança podem estar faltando');
    }
  }

  async checkInputValidation() {
    const apiFiles = await this.findAPIFiles();
    
    for (const file of apiFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      // Procurar por rotas que recebem dados sem validação
      const routes = content.match(/app\.(get|post|put|delete)\(/g) || [];
      
      if (routes.length > 0) {
        // Verificar se há validação
        if (!content.includes('validate') && !content.includes('joi') && !content.includes('yup')) {
          this.addIssue('medium', 'Input Validation', `Possível falta de validação em: ${path.basename(file)}`);
        }
      }
    }
  }

  async checkRateLimiting() {
    const serverFiles = await this.findServerFiles();
    
    let rateLimitFound = false;
    
    for (const file of serverFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      if (content.includes('rateLimit') || content.includes('express-rate-limit')) {
        rateLimitFound = true;
      }
    }

    if (!rateLimitFound) {
      this.addIssue('medium', 'Rate Limiting', 'Rate limiting não implementado');
    }
  }

  async checkAuditLogs() {
    const monitoringPath = path.join(this.projectRoot, 'modules/monitoring/index.js');
    
    if (await fs.pathExists(monitoringPath)) {
      const content = await fs.readFile(monitoringPath, 'utf8');
      
      if (!content.includes('audit') && !content.includes('log')) {
        this.addIssue('low', 'Audit Logs', 'Sistema de auditoria pode não estar completo');
      }
    } else {
      this.addIssue('medium', 'Audit Logs', 'Módulo de monitoramento não encontrado');
    }
  }

  async checkHTTPS() {
    // Verificar configurações de deploy
    const deployFiles = [
      'vercel.json',
      'render.yaml',
      'Dockerfile',
      '.github/workflows/ci-cd.yml'
    ];

    let httpsConfigFound = false;

    for (const file of deployFiles) {
      const filePath = path.join(this.projectRoot, file);
      
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, 'utf8');
        
        if (content.includes('https') || content.includes('ssl') || content.includes('tls')) {
          httpsConfigFound = true;
        }
      }
    }

    if (!httpsConfigFound) {
      this.addIssue('medium', 'HTTPS', 'Configuração HTTPS não encontrada nos arquivos de deploy');
    }
  }

  async checkXSS() {
    const frontendFiles = await this.findFrontendFiles();
    
    for (const file of frontendFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      // Procurar por uso perigoso de innerHTML ou dangerouslySetInnerHTML
      if (content.includes('innerHTML') || content.includes('dangerouslySetInnerHTML')) {
        this.addIssue('high', 'XSS Protection', `Possível vulnerabilidade XSS em: ${path.basename(file)}`);
      }
    }
  }

  async checkSQLInjection() {
    const serverFiles = await this.findServerFiles();
    
    for (const file of serverFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      // Procurar por concatenação de SQL (sinal de possível SQL injection)
      if (content.includes('SELECT * FROM') || content.includes('INSERT INTO')) {
        if (content.includes('+') && content.includes('req.')) {
          this.addIssue('high', 'SQL Injection', `Possível SQL injection em: ${path.basename(file)}`);
        }
      }
    }
  }

  async checkCORS() {
    const serverFiles = await this.findServerFiles();
    
    let corsFound = false;
    let wildcardCors = false;

    for (const file of serverFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      if (content.includes('cors')) {
        corsFound = true;
        
        if (content.includes('origin: "*"') || content.includes("origin: '*'")) {
          wildcardCors = true;
        }
      }
    }

    if (!corsFound) {
      this.addIssue('medium', 'CORS', 'CORS não configurado');
    } else if (wildcardCors) {
      this.addIssue('medium', 'CORS', 'CORS configurado com wildcard (*) - muito permissivo');
    }
  }

  async checkHardcodedSecrets() {
    const allFiles = await this.findAllFiles();
    
    const secretPatterns = [
      /sk_live_[a-zA-Z0-9]+/, // Stripe live keys
      /sk_test_[a-zA-Z0-9]+/, // Stripe test keys
      /AIza[0-9A-Za-z\\-_]{35}/, // Google API keys
      /[0-9a-f]{32}/, // MD5 hashes / API keys
      /[0-9a-f]{40}/, // SHA1 hashes
      /[A-Za-z0-9+/]{64}/ // Base64 encoded secrets
    ];

    for (const file of allFiles) {
      if (file.includes('node_modules') || file.includes('.git')) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            this.addIssue('high', 'Hardcoded Secrets', `Possível secret hardcoded em: ${path.basename(file)}`);
            break;
          }
        }
      } catch (error) {
        // Ignorar erros de leitura de arquivos binários
      }
    }
  }

  async findAPIFiles() {
    return this.findFilesByPattern(['**/routes/**/*.js', '**/api/**/*.js', '**/*api*.js']);
  }

  async findServerFiles() {
    return this.findFilesByPattern(['**/server/**/*.js', '**/backend/**/*.js', 'server.js', 'app.js']);
  }

  async findFrontendFiles() {
    return this.findFilesByPattern(['**/components/**/*.js', '**/pages/**/*.js', '**/src/**/*.js', '**/templates/**/*.js']);
  }

  async findAllFiles() {
    return this.findFilesByPattern(['**/*.js', '**/*.ts', '**/*.json', '**/*.yml', '**/*.yaml']);
  }

  async findFilesByPattern(patterns) {
    const files = [];
    
    for (const pattern of patterns) {
      // Implementação simplificada - em produção usaria glob
      const found = await this.recursiveFileSearch(this.projectRoot, /\.(js|ts|json|yml|yaml)$/);
      files.push(...found);
    }
    
    return [...new Set(files)]; // Remover duplicatas
  }

  async recursiveFileSearch(dir, pattern) {
    const files = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          const subFiles = await this.recursiveFileSearch(fullPath, pattern);
          files.push(...subFiles);
        } else if (stat.isFile() && pattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorar erros de acesso
    }
    
    return files;
  }

  addIssue(severity, category, description) {
    this.issues.push({
      severity,
      category,
      description,
      timestamp: new Date().toISOString()
    });
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 RELATÓRIO DE SEGURANÇA - ORYUM NEXUS');
    console.log('='.repeat(60));

    // Agrupar por severidade
    const groupedIssues = this.issues.reduce((acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = [];
      acc[issue.severity].push(issue);
      return acc;
    }, {});

    const severities = ['high', 'medium', 'low'];
    const severityEmojis = { high: '🚨', medium: '⚠️ ', low: 'ℹ️ ' };
    const severityNames = { high: 'ALTA', medium: 'MÉDIA', low: 'BAIXA' };

    for (const severity of severities) {
      const issues = groupedIssues[severity] || [];
      
      if (issues.length > 0) {
        console.log(`\n${severityEmojis[severity]} SEVERIDADE ${severityNames[severity]} (${issues.length} problemas):`);
        
        issues.forEach((issue, index) => {
          console.log(`  ${index + 1}. [${issue.category}] ${issue.description}`);
        });
      }
    }

    // Resumo
    const totalIssues = this.issues.length;
    const highSeverity = (groupedIssues.high || []).length;
    const mediumSeverity = (groupedIssues.medium || []).length;
    const lowSeverity = (groupedIssues.low || []).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO:');
    console.log(`Total de problemas encontrados: ${totalIssues}`);
    console.log(`🚨 Alta severidade: ${highSeverity}`);
    console.log(`⚠️  Média severidade: ${mediumSeverity}`);
    console.log(`ℹ️  Baixa severidade: ${lowSeverity}`);

    // Score de segurança
    const maxScore = 100;
    const penalty = { high: 15, medium: 5, low: 1 };
    const score = Math.max(0, maxScore - (
      highSeverity * penalty.high +
      mediumSeverity * penalty.medium +
      lowSeverity * penalty.low
    ));

    console.log(`\n🛡️  SCORE DE SEGURANÇA: ${score}/100`);

    if (score >= 90) {
      console.log('✅ Excelente! Seu projeto está muito seguro.');
    } else if (score >= 70) {
      console.log('⚠️  Bom, mas há melhorias a fazer.');
    } else if (score >= 50) {
      console.log('🚨 Atenção! Problemas de segurança detectados.');
    } else {
      console.log('💥 CRÍTICO! Corrija os problemas imediatamente.');
    }

    console.log('='.repeat(60) + '\n');

    // Salvar relatório em arquivo
    this.saveReport(groupedIssues, score);
  }

  async saveReport(groupedIssues, score) {
    const report = {
      timestamp: new Date().toISOString(),
      score,
      summary: {
        total: this.issues.length,
        high: (groupedIssues.high || []).length,
        medium: (groupedIssues.medium || []).length,
        low: (groupedIssues.low || []).length
      },
      issues: this.issues
    };

    const reportsDir = path.join(this.projectRoot, 'security-reports');
    await fs.ensureDir(reportsDir);

    const reportFile = path.join(reportsDir, `security-audit-${Date.now()}.json`);
    await fs.writeJson(reportFile, report, { spaces: 2 });

    console.log(`📄 Relatório salvo em: ${reportFile}`);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new SecurityChecker();
  checker.runAudit().catch(console.error);
}

export default SecurityChecker;