import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API de Gerenciamento de Inscrições Push
 * 
 * Esta API gerencia o armazenamento e remoção de inscrições para notificações push.
 * Mantém um registro de quais dispositivos de quais usuários devem receber notificações.
 */

/**
 * POST /api/push/subscribe
 * 
 * Cria ou atualiza uma inscrição para notificações push.
 * Recebe uma inscrição de push do navegador do cliente e a armazena no banco de dados.
 * 
 * Requer autenticação.
 * 
 * @param request Objeto Request contendo a inscrição push no formato:
 * {
 *   subscription: {
 *     endpoint: string;     // URL do endpoint do serviço de push
 *     keys: {
 *       p256dh: string;     // Chave pública para criptografia
 *       auth: string;       // Token de autenticação
 *     }
 *   }
 * }
 * 
 * @returns JSON com status da operação
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error('Tentativa de inscrição push sem autenticação');
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Obter dados da requisição
    const data = await request.json();
    
    // Validar dados
    if (!data.subscription || !data.subscription.endpoint || !data.subscription.keys) {
      console.error('Dados de inscrição inválidos:', JSON.stringify(data, null, 2));
      return NextResponse.json({ error: "Dados de inscrição inválidos" }, { status: 400 });
    }

    const { endpoint, keys } = data.subscription;
    
    // Verificar se já existe uma inscrição com este endpoint
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });

    if (existingSubscription) {
      // Atualizar inscrição existente
      console.log('Atualizando inscrição existente para o usuário:', session.user.id);
      // @ts-expect-error - Contornando erro de tipo do Prisma
      await prisma.pushSubscription.update({
        where: { endpoint },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          usuarioId: session.user.id,
          updatedAt: new Date()
        }
      });
    } else {
      // Criar nova inscrição
      console.log('Criando nova inscrição para o usuário:', session.user.id);
      // @ts-expect-error - Contornando erro de tipo do Prisma
      await prisma.pushSubscription.create({
        data: {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          usuarioId: session.user.id
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: "Notificações ativadas com sucesso"
    });
  } catch (error) {
    console.error("Erro ao salvar inscrição push:", error);
    return NextResponse.json({ 
      error: "Falha ao salvar inscrição de notificação",
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}

/**
 * DELETE /api/push/subscribe
 * 
 * Remove uma inscrição de notificações push.
 * Executada quando o usuário desativa as notificações ou troca de dispositivo.
 * 
 * Requer autenticação.
 * 
 * @param request Objeto Request com o parâmetro endpoint na URL:
 * /api/push/subscribe?endpoint=https://fcm.googleapis.com/...
 * 
 * @returns JSON com status da operação
 */
export async function DELETE(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error('Tentativa de cancelamento de inscrição push sem autenticação');
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    
    // Obter endpoint da URL
    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint");
    
    if (!endpoint) {
      console.error('Tentativa de cancelamento sem informar endpoint');
      return NextResponse.json({ error: "Endpoint não fornecido" }, { status: 400 });
    }
    
    // Verificar se a inscrição existe
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });
    
    if (!subscription) {
      console.error('Inscrição não encontrada para o endpoint:', endpoint);
      return NextResponse.json({ error: "Inscrição não encontrada" }, { status: 404 });
    }
    
    // Verificar se pertence ao usuário
    if (subscription.usuarioId !== session.user.id) {
      console.error('Usuário não autorizado a excluir esta inscrição');
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }
    
    // Excluir a inscrição
    // @ts-expect-error - Contornando erro de tipo do Prisma
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Notificações desativadas com sucesso"
    });
  } catch (error) {
    console.error("Erro ao cancelar inscrição push:", error);
    return NextResponse.json({ 
      error: "Falha ao cancelar inscrição de notificação",
      details: error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
} 