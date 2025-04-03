import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncAllAniversariosWithCalendar } from "@/lib/aniversario";

/**
 * API para sincronizar aniversários com eventos no calendário
 * 
 * Esta API atualiza todos os aniversários para o ano atual no calendário.
 * Útil para executar na inicialização do sistema ou periodicamente.
 * Apenas administradores têm acesso.
 */

/**
 * POST /api/aniversarios/sincronizar
 * 
 * Executa a sincronização de todos os aniversários para eventos no calendário
 * 
 * @returns Resultado da sincronização
 */
export async function POST() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é administrador
    const userTipo = session.user.tipoUsuario as string;
    if (!userTipo || !['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(userTipo)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Sincronizar aniversários
    const result = await syncAllAniversariosWithCalendar();
    
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${result.count} aniversários atualizados no calendário.`
    });
  } catch (error) {
    console.error('Erro ao sincronizar aniversários:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar aniversários' 
    }, { status: 500 });
  }
}

/**
 * GET /api/aniversarios/sincronizar
 * 
 * Endpoint alternativo para permitir sincronização via chamada GET, facilitando
 * testes e sincronização via tarefas agendadas.
 * 
 * @returns Resultado da sincronização
 */
export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é administrador
    const userTipo = session.user.tipoUsuario as string;
    if (!userTipo || !['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(userTipo)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    
    // Sincronizar aniversários
    const result = await syncAllAniversariosWithCalendar();
    
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída: ${result.count} aniversários atualizados no calendário.`
    });
  } catch (error) {
    console.error('Erro ao sincronizar aniversários:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao sincronizar aniversários' 
    }, { status: 500 });
  }
} 