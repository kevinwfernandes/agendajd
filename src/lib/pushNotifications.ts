import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Verificar se as chaves VAPID estão configuradas
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@agendajd.com";

// Configuração VAPID somente se as chaves estiverem disponíveis
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );
    console.log('Configuração VAPID inicializada com sucesso.');
  } catch (error) {
    console.error('Erro ao inicializar configuração VAPID:', error);
  }
} else {
  console.warn('Chaves VAPID não configuradas. Notificações push não estarão disponíveis.');
}

// Função para enviar notificação para um único usuário
export async function sendNotificationToUser(
  userId: string,
  titulo: string,
  mensagem: string,
  url?: string
) {
  try {
    // Verificar se as chaves VAPID estão configuradas
    if (!vapidPublicKey || !vapidPrivateKey || vapidPublicKey === '' || vapidPrivateKey === '') {
      return { success: false, message: 'Chaves VAPID não configuradas' };
    }

    // Buscar todas as inscrições push do usuário
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        usuarioId: userId,
      },
    });

    if (subscriptions.length === 0) {
      return { success: false, message: 'Usuário não tem inscrições push' };
    }

    const notificationPayload = {
      titulo,
      mensagem,
      url: url || '/',
      timestamp: new Date().toISOString(),
    };

    // Erros durante o envio
    const errors: string[] = [];

    // Enviar para cada inscrição
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );
      } catch (error) {
        // Verificar se a inscrição expirou ou foi removida
        if (
          error instanceof Error &&
          error.name === 'WebPushError' &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          // Remover inscrição inválida
          try {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint },
            });
          } catch (deleteError) {
            console.error('Erro ao remover inscrição inválida:', deleteError);
          }
        }

        errors.push(subscription.endpoint);
      }
    }

    return {
      success: true,
      totalSent: subscriptions.length - errors.length,
      totalFailed: errors.length,
    };
  } catch (error) {
    console.error('Erro ao enviar notificação push para usuário:', error);
    return { success: false, error: 'Erro interno ao enviar notificação' };
  }
}

// Função para enviar notificação para usuários de uma classe
export async function sendNotificationToClass(
  classeId: number,
  titulo: string,
  mensagem: string,
  url?: string
) {
  try {
    // Buscar todos os usuários da classe
    const usuarios = await prisma.user.findMany({
      where: {
        classeId,
      },
      select: {
        id: true,
      },
    });

    if (usuarios.length === 0) {
      return { success: false, message: 'Nenhum usuário encontrado nesta classe' };
    }

    const usuarioIds = usuarios.map(u => u.id);

    // Buscar todas as inscrições push dos usuários
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        usuarioId: {
          in: usuarioIds,
        },
      },
    });

    if (subscriptions.length === 0) {
      return { success: false, message: 'Nenhuma inscrição push encontrada para esta classe' };
    }

    const notificationPayload = {
      titulo,
      mensagem,
      url: url || '/',
      timestamp: new Date().toISOString(),
    };

    // Contador de sucessos e falhas
    let successCount = 0;
    let failureCount = 0;

    // Enviar para cada inscrição
    for (const subscription of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload)
        );
        
        successCount++;
      } catch (error) {
        failureCount++;
        
        // Verificar se a inscrição expirou ou foi removida
        if (
          error instanceof Error &&
          error.name === 'WebPushError' &&
          (error.statusCode === 404 || error.statusCode === 410)
        ) {
          // Remover inscrição inválida
          try {
            await prisma.pushSubscription.delete({
              where: { endpoint: subscription.endpoint },
            });
          } catch (deleteError) {
            console.error('Erro ao remover inscrição inválida:', deleteError);
          }
        }
      }
    }

    return {
      success: true,
      totalSubscriptions: subscriptions.length,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error('Erro ao enviar notificação push para classe:', error);
    return { success: false, error: 'Erro interno ao enviar notificação' };
  }
}

// Função para criar notificação ao criar um evento
export async function notifyAboutNewEvent(evento: any) {
  try {
    // Determinar quem deve receber a notificação
    let usuarioIds: string[] = [];
    
    if (evento.publico) {
      // Se for público, buscar todos os usuários
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      usuarioIds = allUsers.map(u => u.id);
    } else if (evento.classeId) {
      // Se for para uma classe específica
      const classUsers = await prisma.user.findMany({
        where: { classeId: evento.classeId },
        select: { id: true }
      });
      usuarioIds = classUsers.map(u => u.id);
    }
    
    // Criar notificações no banco de dados
    for (const userId of usuarioIds) {
      // Não notificar o próprio autor
      if (userId === evento.autorId) continue;
      
      await prisma.notificacao.create({
        data: {
          titulo: 'Novo Evento',
          mensagem: `${evento.titulo} - ${new Date(evento.data).toLocaleString('pt-BR')}`,
          usuarioId: userId,
          eventoId: evento.id
        }
      });
    }
    
    // Enviar notificações push
    if (evento.classeId) {
      await sendNotificationToClass(
        evento.classeId,
        'Novo Evento',
        evento.titulo,
        `/calendario?evento=${evento.id}`
      );
    } else if (evento.publico) {
      // Se for público, enviar notificação para cada usuário
      for (const userId of usuarioIds) {
        // Não notificar o próprio autor
        if (userId === evento.autorId) continue;
        
        await sendNotificationToUser(
          userId,
          'Novo Evento',
          evento.titulo,
          `/calendario?evento=${evento.id}`
        );
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao notificar sobre novo evento:', error);
    return { success: false, error: 'Erro ao enviar notificações' };
  }
} 