"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Componente PushNotificationManager
 * 
 * Este componente gerencia o registro e cancelamento de notificações push.
 * Permite que o usuário ative ou desative as notificações do sistema.
 * 
 * Fluxo principal:
 * 1. Verifica se o navegador suporta notificações push
 * 2. Verifica se já existe uma inscrição ativa
 * 3. Permite ao usuário ativar/desativar notificações
 * 4. Envia a inscrição para o servidor através da API
 */
export function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  /**
   * Verifica o suporte do navegador e status da inscrição
   * Executado na montagem do componente
   */
  useEffect(() => {
    const checkPushSupport = async () => {
      // Verifica se o navegador suporta Service Worker e Push API
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Notificações push não são suportadas neste navegador');
        setIsSupported(false);
        return;
      }

      // Verificar se a chave VAPID pública está configurada
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        console.error('Chave VAPID pública não está configurada');
        setError('Configuração de notificações ausente no servidor');
        setIsSupported(false);
        return;
      }
      
      setVapidKey(publicKey);
      console.log('Chave VAPID encontrada:', publicKey.substring(0, 10) + '...');

      try {
        // Verificar se o service worker está registrado
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker está pronto:', registration.scope);
        
        // Verificar se já existe uma inscrição
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        console.log('Status de inscrição:', !!subscription);
      } catch (err) {
        console.error('Erro ao verificar status da inscrição:', err);
        setError('Não foi possível verificar o status das notificações. Tente recarregar a página.');
      }
    };

    // Só executa se o usuário estiver autenticado
    if (session) {
      checkPushSupport();
    }
  }, [session]);

  /**
   * Gerencia a ativação/desativação das notificações push
   * Este método é chamado quando o usuário clica no botão
   */
  const handleSubscriptionToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Seu navegador não suporta notificações push');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Verificar permissão do usuário para notificações
      const permissionStatus = await Notification.requestPermission();
      if (permissionStatus !== 'granted') {
        throw new Error(`Permissão para notificações ${permissionStatus}. Você precisa permitir notificações no seu navegador.`);
      }
      
      console.log('Permissão para notificações concedida');
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Cancelar inscrição
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          console.log('Inscrição cancelada localmente');
          
          // Informar o servidor
          const response = await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Erro ao desativar no servidor: ${errorData.error || response.statusText}`);
          }
          
          console.log('Inscrição removida do servidor');
          setIsSubscribed(false);
        }
      } else {
        // Ativar notificações - Obter chave pública VAPID
        if (!vapidKey) {
          throw new Error('Chave VAPID não configurada');
        }
        
        // Converter chave base64 para Uint8Array (formato exigido pela API)
        const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
        console.log('Chave VAPID convertida para formato apropriado');
        
        // Criar nova inscrição no push service do navegador
        console.log('Tentando criar inscrição push...');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,  // Todas as notificações devem ser visíveis para o usuário
          applicationServerKey: convertedVapidKey  // Chave pública para autenticar o servidor
        });
        
        console.log('Inscrição criada localmente, enviando ao servidor...');
        
        // Enviar inscrição para o servidor
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Erro ao salvar no servidor: ${errorData.error || response.statusText}`);
        }
        
        console.log('Inscrição salva com sucesso no servidor');
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Erro ao gerenciar inscrição push:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : (isSubscribed 
              ? 'Falha ao cancelar notificações' 
              : 'Falha ao ativar notificações. Verifique as permissões do navegador.')
      );
    } finally {
      setLoading(false);
    }
  };

  // Se usuário não estiver autenticado, não mostrar nada
  if (!session) {
    return null;
  }
  
  // Se navegador não suportar, mostrar mensagem informativa
  if (!isSupported) {
    return (
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Notificações Push</h2>
        <p className="text-sm text-red-600 mb-4">
          {error || "Seu navegador não suporta notificações push ou as permissões foram bloqueadas."}
        </p>
        <a 
          href="https://support.google.com/chrome/answer/3220216?hl=pt-BR" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-jd-primary hover:underline"
        >
          Saiba como ativar notificações no seu navegador
        </a>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Notificações Push</h2>
      
      <p className="text-sm text-gray-600 mb-4">
        {isSubscribed 
          ? 'Você está recebendo notificações de novos eventos e recados.' 
          : 'Ative as notificações para ser informado sobre novos eventos e recados.'}
      </p>
      
      {error && (
        <div className="p-2 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <button
        onClick={handleSubscriptionToggle}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isSubscribed
            ? 'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500'
            : 'bg-jd-primary text-white hover:bg-jd-primary-dark focus:ring-jd-primary'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading
          ? 'Processando...'
          : isSubscribed
            ? 'Desativar Notificações'
            : 'Ativar Notificações'}
      </button>
    </div>
  );
}

/**
 * Utilitário para converter a chave VAPID de base64 para Uint8Array
 * Necessário para utilização com a API PushManager.subscribe
 * 
 * @param base64String - String em base64 (chave VAPID pública)
 * @returns Uint8Array com a chave convertida
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Adicionar padding se necessário
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  
  // Converter caracteres base64 URL-safe para base64 padrão
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  // Decodificar a string base64 para dados binários
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  // Converter para Uint8Array
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 