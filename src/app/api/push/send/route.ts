import { NextResponse } from "next/server";
import { PrismaClient, TipoUsuario } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import webpush from "web-push";

const prisma = new PrismaClient();

// Verificar se as chaves VAPID estão configuradas
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

// Configuração VAPID somente se as chaves estiverem disponíveis
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@agendajd.com",
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn('Chaves VAPID não configuradas. Notificações push não estarão disponíveis.');
}

// POST /api/push/send - Enviar notificação push
export async function POST(request: Request) {
  try {
    // Verificar se as chaves VAPID estão configuradas
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: "Chaves VAPID não configuradas. Configure as variáveis de ambiente VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY." },
        { status: 500 }
      );
    }

    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Verificar se é administrador
    const userTipo = session.user.tipoUsuario as TipoUsuario;
    const isAdmin = userTipo === TipoUsuario.MACOM_ADMIN_GERAL || 
                  userTipo === TipoUsuario.ADMIN_DM || 
                  userTipo === TipoUsuario.ADMIN_FDJ || 
                  userTipo === TipoUsuario.ADMIN_FRATERNA;
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Apenas administradores podem enviar notificações push" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validar dados da requisição
    if (!data.titulo || !data.mensagem) {
      return NextResponse.json(
        { error: "Título e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    // Configurar parâmetros de filtro
    const filter: any = {};
    
    // Filtrar por usuários específicos
    if (data.usuarioIds && Array.isArray(data.usuarioIds) && data.usuarioIds.length > 0) {
      filter.usuarioId = { in: data.usuarioIds };
    }
    
    // Filtrar por classe
    if (data.classeId) {
      // Buscar usuários da classe
      const usuariosDaClasse = await prisma.user.findMany({
        where: {
          classeId: data.classeId
        },
        select: {
          id: true
        }
      });
      
      const usuarioIds = usuariosDaClasse.map(u => u.id);
      
      if (usuarioIds.length > 0) {
        if (filter.usuarioId) {
          // Interseção com usuários já filtrados
          filter.usuarioId.in = filter.usuarioId.in.filter((id: string) => 
            usuarioIds.includes(id)
          );
        } else {
          filter.usuarioId = { in: usuarioIds };
        }
      }
    }

    // Buscar todas as inscrições push que atendem ao filtro
    const subscriptions = await prisma.pushSubscription.findMany({
      where: filter
    });

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma inscrição encontrada para os filtros especificados" },
        { status: 200 }
      );
    }

    // Dados a serem enviados na notificação
    const notificationPayload = {
      titulo: data.titulo,
      mensagem: data.mensagem,
      url: data.url || '/',
      timestamp: new Date().toISOString()
    };

    // Armazenar erros de envio
    const errors: { subscription: string; error: string }[] = [];
    
    // Contador de notificações enviadas com sucesso
    let successCount = 0;

    // Enviar notificações push para cada inscrição
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );
        
        successCount++;
      } catch (error) {
        console.error(`Erro ao enviar para ${subscription.endpoint}:`, error);
        
        // Se o erro for 404 ou 410, a inscrição expirou ou foi removida
        if (
          error instanceof Error && 
          (error.name === 'WebPushError' && 
           (error.statusCode === 404 || error.statusCode === 410))
        ) {
          // Remover inscrição inválida
          try {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint }
            });
          } catch (deleteError) {
            console.error('Erro ao remover inscrição inválida:', deleteError);
          }
        }
        
        errors.push({
          subscription: subscription.endpoint,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    });

    await Promise.all(sendPromises);

    // Retornar resultado
    return NextResponse.json({
      success: true,
      totalSubscriptions: subscriptions.length,
      successCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Erro ao enviar notificações push:", error);
    return NextResponse.json(
      { error: "Erro ao enviar notificações push" },
      { status: 500 }
    );
  }
} 