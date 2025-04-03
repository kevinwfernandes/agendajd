// Script para executar migrações e seed
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verificar variáveis de ambiente
console.log('Verificando variáveis de ambiente...');
if (!process.env.DATABASE_URL) {
  console.error('ERRO: Variável DATABASE_URL não definida. Configure a string de conexão do banco de dados.');
  process.exit(1);
}

console.log('String de conexão encontrada:', process.env.DATABASE_URL.substring(0, 20) + '...');

// Verificar se as migrações existem
const migrationsPath = path.join(__dirname, 'migrations');
if (!fs.existsSync(migrationsPath)) {
  console.error('ERRO: Diretório de migrações não encontrado. Certifique-se de que as migrações foram criadas.');
  process.exit(1);
}

try {
  // Executar as migrações
  console.log('\n=== EXECUTANDO MIGRAÇÕES ===');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  
  // Executar o seed
  console.log('\n=== EXECUTANDO SEED ===');
  execSync('node prisma/seed.js', { stdio: 'inherit' });
  
  console.log('\n=== DEPLOY E SEED CONCLUÍDOS COM SUCESSO ===');
} catch (error) {
  console.error('\nERRO durante o processo:', error.message);
  process.exit(1);
} 