// Script para recuperar de uma migração falha
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

// Função principal
async function main() {
  console.log('Iniciando processo de recuperação de migração...');
  
  // Verificar variáveis de ambiente
  if (!process.env.DATABASE_URL) {
    console.error('ERRO: Variável DATABASE_URL não definida. Configure a string de conexão do banco de dados.');
    process.exit(1);
  }
  
  console.log('String de conexão encontrada:', process.env.DATABASE_URL.substring(0, 20) + '...');
  
  try {
    // Tentar corrigir diretamente no banco de dados
    await fixDatabaseManually();
    
    console.log('Recuperação de migração concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante o processo de recuperação:', error);
    process.exit(1);
  }
}

// Função para corrigir o banco de dados manualmente
async function fixDatabaseManually() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Conectando ao banco de dados...');
    await prisma.$connect();
    
    console.log('Verificando status da migração...');
    
    // Verificar se já existe uma entrada de migração com falha
    const failedMigration = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations 
      WHERE migration_name = '20250403180000_add_comentario_recado' 
      AND applied_steps_count < finished_at IS NULL
    `;
    
    console.log('Status da verificação:', failedMigration);
    
    // Marcar a migração como revertida (se existir como falha)
    if (Array.isArray(failedMigration) && failedMigration.length > 0) {
      console.log('Encontrada migração com falha, tentando marcar como aplicada...');
      
      // Marcar a migração como aplicada
      await prisma.$executeRaw`
        UPDATE _prisma_migrations
        SET finished_at = NOW(), 
            applied_steps_count = 1, 
            logs = 'Manually marked as applied during recovery'
        WHERE migration_name = '20250403180000_add_comentario_recado'
      `;
      
      console.log('Migração marcada como aplicada no registro de migrações.');
    }
    
    // Verificar se a tabela já existe
    console.log('Verificando se a tabela ComentarioRecado já existe...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ComentarioRecado'
      );
    `;
    
    const exists = Array.isArray(tableExists) && tableExists.length > 0 && tableExists[0].exists;
    
    if (exists) {
      console.log('Tabela ComentarioRecado já existe, não é necessário criá-la novamente.');
    } else {
      console.log('Criando tabela ComentarioRecado manualmente...');
      
      // Criar tabela manualmente
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ComentarioRecado" (
            "id" SERIAL NOT NULL,
            "texto" TEXT NOT NULL,
            "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "autorId" TEXT NOT NULL,
            "recadoId" INTEGER NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ComentarioRecado_pkey" PRIMARY KEY ("id")
        );
      `;
      
      // Criar índices
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ComentarioRecado_autorId_idx" ON "ComentarioRecado"("autorId");
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ComentarioRecado_data_idx" ON "ComentarioRecado"("data");
      `;
      
      // Adicionar chaves estrangeiras
      try {
        await prisma.$executeRaw`
          ALTER TABLE "ComentarioRecado" 
          ADD CONSTRAINT "ComentarioRecado_autorId_fkey" 
          FOREIGN KEY ("autorId") REFERENCES "users"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `;
      } catch (e) {
        console.warn('Aviso: Não foi possível adicionar a chave estrangeira para autorId:', e.message);
      }
      
      try {
        await prisma.$executeRaw`
          ALTER TABLE "ComentarioRecado" 
          ADD CONSTRAINT "ComentarioRecado_recadoId_fkey" 
          FOREIGN KEY ("recadoId") REFERENCES "Recado"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `;
      } catch (e) {
        console.warn('Aviso: Não foi possível adicionar a chave estrangeira para recadoId:', e.message);
      }
      
      console.log('Tabela ComentarioRecado criada com sucesso!');
    }
    
    // Inserir o registro de migração se não existir
    const migrationExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM _prisma_migrations 
        WHERE migration_name = '20250403180000_add_comentario_recado'
      );
    `;
    
    const migrationRecordExists = Array.isArray(migrationExists) && 
                               migrationExists.length > 0 && 
                               migrationExists[0].exists;
    
    if (!migrationRecordExists) {
      console.log('Inserindo registro de migração...');
      await prisma.$executeRaw`
        INSERT INTO _prisma_migrations (
          migration_name, 
          started_at, 
          applied_steps_count, 
          finished_at, 
          logs
        ) VALUES (
          '20250403180000_add_comentario_recado',
          NOW(),
          1,
          NOW(),
          'Manually applied during recovery'
        );
      `;
      console.log('Registro de migração inserido com sucesso!');
    }
    
    console.log('Processo de recuperação do banco de dados concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante a recuperação manual:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a função principal
main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 