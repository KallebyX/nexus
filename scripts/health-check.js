#!/usr/bin/env node

/**
 * Script de checagem de saúde do Oryum Nexus
 * Verifica status de todos os módulos e serviços
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class HealthChecker {
  constructor() {
    this.checks = [];
    this.results = [];
  }

  async run() {
    console.log('🔍 Iniciando verificação de saúde do Nexus...\n');

    // Verificar configuração
    await this.checkConfig();
    
    // Verificar módulos
    await this.checkModules();
    
    // Verificar dependências
    await this.checkDependencies();
    
    // Verificar scripts
    await this.checkScripts();

    this.printResults();
  }

  async checkConfig() {
    const configPath = join(__dirname, '../nexus.config.js');
    
    if (existsSync(configPath)) {
      this.addResult('✅', 'Configuração', 'nexus.config.js encontrado');
    } else {
      this.addResult('❌', 'Configuração', 'nexus.config.js não encontrado');
    }
  }

  async checkModules() {
    const modulesPath = join(__dirname, '../modules');
    const expectedModules = ['auth', 'database', 'ui', 'ai'];
    
    for (const module of expectedModules) {
      const modulePath = join(modulesPath, module);
      if (existsSync(modulePath)) {
        this.addResult('✅', 'Módulos', `${module} disponível`);
      } else {
        this.addResult('⚠️', 'Módulos', `${module} não encontrado`);
      }
    }
  }

  async checkDependencies() {
    const packagePath = join(__dirname, '../package.json');
    
    if (existsSync(packagePath)) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {});
      
      this.addResult('✅', 'Dependências', `${deps.length} dependências encontradas`);
    } else {
      this.addResult('❌', 'Dependências', 'package.json não encontrado');
    }
  }

  async checkScripts() {
    const scriptsPath = join(__dirname, '../scripts');
    
    if (existsSync(scriptsPath)) {
      this.addResult('✅', 'Scripts', 'Diretório de scripts encontrado');
    } else {
      this.addResult('⚠️', 'Scripts', 'Diretório de scripts não encontrado');
    }
  }

  addResult(status, category, message) {
    this.results.push({ status, category, message });
  }

  printResults() {
    console.log('\n📊 Resultados da Verificação:\n');
    
    const grouped = this.results.reduce((acc, result) => {
      if (!acc[result.category]) acc[result.category] = [];
      acc[result.category].push(result);
      return acc;
    }, {});

    for (const [category, results] of Object.entries(grouped)) {
      console.log(`\n${category}:`);
      results.forEach(result => {
        console.log(`  ${result.status} ${result.message}`);
      });
    }

    const hasErrors = this.results.some(r => r.status === '❌');
    const hasWarnings = this.results.some(r => r.status === '⚠️');

    console.log('\n' + '='.repeat(50));
    
    if (hasErrors) {
      console.log('🚨 Status: FALHAS CRÍTICAS DETECTADAS');
    } else if (hasWarnings) {
      console.log('⚠️  Status: AVISOS ENCONTRADOS');
    } else {
      console.log('✅ Status: SISTEMA SAUDÁVEL');
    }
    
    console.log('='.repeat(50) + '\n');
  }
}

// Export for testing
export { HealthChecker };

// Executar verificação
const checker = new HealthChecker();
checker.run().catch(console.error);