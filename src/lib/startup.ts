import { syncAllAniversariosWithCalendar } from './aniversario';

/**
 * Tarefas executadas na inicialização do servidor
 * 
 * Este arquivo contém operações que serão executadas quando o servidor Next.js iniciar.
 * Inclui tarefas como:
 * - Sincronização de aniversários com eventos do calendário
 * - Outras tarefas de inicialização necessárias
 */

// Executar de forma assíncrona para não bloquear a inicialização da aplicação
(async () => {
  try {
    console.log('⏳ Executando tarefas de inicialização...');
    
    // Sincronizar aniversários com eventos do calendário
    try {
      const result = await syncAllAniversariosWithCalendar();
      console.log(`✅ Aniversários sincronizados com calendário: ${result.count} atualizados`);
    } catch (error) {
      console.error('❌ Erro ao sincronizar aniversários:', error);
    }
    
    console.log('✅ Tarefas de inicialização concluídas');
  } catch (error) {
    console.error('❌ Erro nas tarefas de inicialização:', error);
  }
})();

export default function initStartup() {
  // Não faz nada, apenas garante que o código acima seja executado
  return {
    initialized: true
  };
} 