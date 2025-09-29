/**
 * Migrate Script - Nexus Framework
 * Script para executar migrações do banco de dados
 */

import { initializeDatabase } from '../modules/database/index.js';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migrações do banco de dados...');
    
    // Inicializar banco
    const db = await initializeDatabase();
    
    // Sincronizar banco (criar tabelas)
    await db.syncDatabase(false); // false = não deletar dados existentes
    
    // Executar seeds se não existir usuário admin
    const adminExists = await db.User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      console.log('🌱 Executando seeds iniciais...');
      
      // Criar usuário admin
      await db.User.create({
        email: 'admin@nexus.dev',
        first_name: 'Admin',
        last_name: 'Nexus',
        password_hash: 'admin123', // Será hasheado automaticamente
        role: 'admin',
        status: 'active',
        email_verified: true,
        email_verified_at: new Date()
      });
      
      console.log('✅ Usuário admin criado: admin@nexus.dev / admin123');
    }
    
    console.log('✅ Migrações concluídas com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    process.exit(1);
  }
}

// Executar se for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export default runMigrations;