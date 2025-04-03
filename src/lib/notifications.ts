import { PrismaClient, Evento, Recado, TipoUsuario } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configurar Web Push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:contato@agendajd.com',
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('Configuração VAPID inicializada com sucesso.');
} else {
  console.warn('Chaves VAPID não configuradas. Notificações push não funcionarão.');
}

/**
 * Limpa assinaturas inválidas após falha no envio.
 * @param endpoint Endpoint da assinatura a ser removida
 */
export async function cleanupInvalidSubscription(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    console.log(`Assinatura expirada removida: ${endpoint}`);
  } catch (err) {
    console.error('Erro ao remover assinatura inválida:', err);
  }
}

/**
 * Envia notificação push
 * @param subscription Assinatura push
 * @param payload Dados da notificação
 */
export async function sendPushNotification(
  subscription: any,
  payload: any
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
    return true;
  } catch (err: any) {
    console.error(`Erro ao enviar notificação push: ${err.message}`);
    
    // Se a assinatura expirou ou é inválida, remover
    if (err.statusCode === 404 || err.statusCode === 410) {
      await cleanupInvalidSubscription(subscription.endpoint);
    }
    
    return false;
  }
}

/**
 * Notifica usuários sobre um novo evento
 * @param evento Evento criado
 */
export async function notifyAboutNewEvent(evento: Evento & { classe?: { id: number, nome: string } | null }) {
  try {
    // Determinar quem deve receber a notificação
    let userFilter: any = {};
    const notificationTitle = 'Novo Evento Adicionado';
    let eventMessage = `Evento: ${evento.titulo}`;
    
    // Se o evento é público, notificar todos os usuários
    if (evento.publico) {
      // Notificar todos os usuários (sem filtro adicional)
    } 
    // Se tem classe específica, notificar usuários da classe e todos os Maçons
    else if (evento.classeId) {
      userFilter = {
        OR: [
          { classeId: evento.classeId },
          { tipoUsuario: { in: ['MACOM', 'MACOM_ADMIN_GERAL'] } }
        ]
      };
      
      if (evento.classe) {
        eventMessage += ` (${evento.classe.nome})`;
      }
    } 
    // Se não é público e não tem classe, só notificar administradores
    else {
      userFilter = {
        tipoUsuario: { 
          in: ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'] 
        }
      };
    }
    
    // Adicionar data do evento à mensagem
    const eventDate = new Date(evento.data);
    eventMessage += ` - ${eventDate.toLocaleDateString()}`;
    
    // Buscar assinaturas de push ativas
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        usuario: userFilter
      }
    });
    
    // Preparar payload da notificação
    const payload = {
      title: notificationTitle,
      message: eventMessage,
      url: `/calendario?evento=${evento.id}`,
      timestamp: new Date().toISOString()
    };
    
    // Enviar notificações push
    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      return sendPushNotification(pushSubscription, payload);
    });
    
    await Promise.all(sendPromises);
    
    // Criar notificações internas no banco de dados
    const usersToNotify = await prisma.user.findMany({
      where: userFilter,
      select: { id: true }
    });
    
    const notificacoesData = usersToNotify.map(user => ({
      titulo: notificationTitle,
      mensagem: eventMessage,
      usuarioId: user.id,
      eventoId: evento.id
    }));
    
    if (notificacoesData.length > 0) {
      await prisma.notificacao.createMany({
        data: notificacoesData
      });
    }
    
    return {
      success: true,
      notificationsSent: subscriptions.length,
      dbNotificationsCreated: notificacoesData.length
    };
  } catch (error) {
    console.error('Erro ao enviar notificações sobre novo evento:', error);
    return { success: false, error };
  }
}

/**
 * Notifica usuários sobre um novo recado
 * @param recado Recado criado
 */
export async function notifyUsersAboutRecado(recado: Recado & { 
  classe?: { id: number, nome: string } | null,
  autor?: { id: string, name?: string, email?: string } | null
}) {
  try {
    // Determinar quem deve receber a notificação
    let userFilter: any = {};
    const notificationTitle = 'Novo Recado no Mural';
    let recadoMessage = `${recado.texto.substring(0, 50)}${recado.texto.length > 50 ? '...' : ''}`;
    
    if (recado.autor?.name) {
      recadoMessage += ` - por ${recado.autor.name}`;
    }
    
    // Se o recado é global, notificar todos os usuários
    if (recado.global) {
      // Notificar todos os usuários (sem filtro adicional)
    } 
    // Se tem classe específica, notificar usuários da classe e todos os Maçons
    else if (recado.classeId) {
      userFilter = {
        OR: [
          { classeId: recado.classeId },
          { tipoUsuario: { in: ['MACOM', 'MACOM_ADMIN_GERAL'] } }
        ]
      };
      
      if (recado.classe) {
        recadoMessage = `[${recado.classe.nome}] ${recadoMessage}`;
      }
    } 
    // Se não é global e não tem classe, só notificar administradores
    else {
      userFilter = {
        tipoUsuario: { 
          in: ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'] 
        }
      };
    }
    
    // Buscar assinaturas de push ativas
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        usuario: userFilter
      }
    });
    
    // Preparar payload da notificação
    const payload = {
      title: notificationTitle,
      message: recadoMessage,
      url: `/recados/${recado.id}`,
      timestamp: new Date().toISOString()
    };
    
    // Enviar notificações push
    const sendPromises = subscriptions.map(sub => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      };
      
      return sendPushNotification(pushSubscription, payload);
    });
    
    await Promise.all(sendPromises);
    
    // Criar notificações internas no banco de dados para os usuários
    const usersToNotify = await prisma.user.findMany({
      where: userFilter,
      select: { id: true }
    });
    
    const notificacoesData = usersToNotify.map(user => ({
      titulo: notificationTitle,
      mensagem: recadoMessage,
      usuarioId: user.id,
      recadoId: recado.id
    }));
    
    if (notificacoesData.length > 0) {
      await prisma.notificacao.createMany({
        data: notificacoesData
      });
    }
    
    return {
      success: true,
      notificationsSent: subscriptions.length,
      dbNotificationsCreated: notificacoesData.length
    };
  } catch (error) {
    console.error('Erro ao enviar notificações sobre novo recado:', error);
    return { success: false, error };
  }
} 