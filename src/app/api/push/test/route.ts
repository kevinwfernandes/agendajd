import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma';

/**
 * API de Teste de Notificações Push
 * 
 * Este endpoint permite testar o envio de notificações push para os dispositivos registrados.
 * É útil para verificar se as chaves VAPID estão configuradas corretamente e se o service worker
 * está recebendo e exibindo as notificações.
 * 
 * Esta API é apenas para fins de desenvolvimento e teste.
 */

// Configurar as credenciais VAPID para o serviço de push
webpush.setVapidDetails(
  'mailto:contato@agendajd.com.br',  // Email de contato (usado pelo serviço de push)
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',  // Chave pública
  process.env.VAPID_PRIVATE_KEY || ''  // Chave privada
);

/**
 * GET /api/push/test
 * 
 * Envia uma notificação de teste para a primeira inscrição encontrada no banco de dados.
 * Útil para verificar se o sistema de notificações está funcionando corretamente.
 * 
 * @returns JSON com os resultados do teste de envio
 */
export async function GET() {
  try {
    // Verificar se as chaves VAPID estão configuradas corretamente
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Chaves VAPID não configuradas' },
        { status: 500 }
      );
    }

    // Obter a primeira inscrição push do banco de dados (para teste)
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const subscriptions = await prisma.pushSubscription.findMany({
      take: 1,  // Apenas para primeiro usuário como teste
    });

    // Se não houver inscrições, retornar erro
    if (subscriptions.length === 0) {
      return NextResponse.json(
        { message: 'Nenhuma inscrição encontrada' },
        { status: 404 }
      );
    }

    // Dados da notificação de teste
    const payload = JSON.stringify({
      titulo: '🔔 Teste de Notificação',
      mensagem: 'Esta é uma notificação de teste do sistema Agenda JD',
      url: '/'  // URL para redirecionar quando a notificação for clicada
    });

    // Enviar notificação para cada inscrição encontrada
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription: {
        endpoint: string;
        p256dh: string;
        auth: string;
      }) => {
        try {
          // Reconstruir objeto de inscrição no formato exigido pela biblioteca web-push
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          };

          // Enviar notificação usando a biblioteca web-push
          const result = await webpush.sendNotification(
            pushSubscription,
            payload
          );
          
          // Retornar resultado do envio
          return { 
            success: true, 
            status: result.statusCode,
            subscription: subscription.endpoint
          };
        } catch (error) {
          // Capturar e registrar erros no envio
          console.error('Erro ao enviar notificação:', error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            subscription: subscription.endpoint
          };
        }
      })
    );

    // Retornar resultados do teste
    return NextResponse.json({
      message: 'Teste de notificação enviado',
      results
    });
  } catch (error) {
    // Capturar e registrar erros gerais
    console.error('Erro ao testar notificações:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 