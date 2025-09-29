/**
 * Nexus Framework Backend Demo
 * Demonstra apenas os módulos backend funcionais
 */

import { NexusApp } from './index.js';

// Configuração simplificada
const appConfig = {
  name: 'Nexus Backend Demo',
  version: '1.0.0',
  environment: 'development',
  port: 3000,
  
  // Apenas módulos backend
  modules: ['database', 'auth', 'api', 'monitoring'],
  
  database: {
    dialect: 'sqlite',
    storage: ':memory:', // SQLite em memória para demo
    logging: false,
    sync: true
  },
  
  auth: {
    jwtSecret: 'demo-secret-123',
    jwtExpiresIn: '1h'
  },
  
  monitoring: {
    logLevel: 'info',
    enableMetrics: true
  }
};

async function startBackendDemo() {
  try {
    console.log('🚀 Starting Nexus Backend Demo...');
    
    const app = new NexusApp(appConfig);
    
    // Event listeners
    app.on('app:started', (data) => {
      console.log('✅ Backend started on port:', data.port);
      console.log('📡 Available endpoints:');
      console.log('   - GET  /health');
      console.log('   - POST /auth/register');
      console.log('   - POST /auth/login');
      console.log('   - GET  /monitoring/health');
      console.log('');
      console.log('🧪 Test with:');
      console.log('   curl http://localhost:3000/health');
    });
    
    await app.init();
    await app.start();
    
    return app;
    
  } catch (error) {
    console.error('❌ Backend demo failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  process.exit(0);
});

startBackendDemo().then(() => {
  console.log('🎉 Nexus Backend Demo is running!');
}).catch(console.error);