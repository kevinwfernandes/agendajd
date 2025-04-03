"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function PushNotificationManager() {
  const { data: session } = useSession();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar suporte do navegador e status da inscrição
  useEffect(() => {
    const checkPushSupport = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setIsSupported(false);
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Erro ao verificar status da inscrição:', err);
        setError('Não foi possível verificar o status das notificações');
      }
    };

    if (session) {
      checkPushSupport();
    }
  }, [session]);

  const handleSubscriptionToggle = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Seu navegador não suporta notificações push');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Cancelar inscrição
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          
          // Informar o servidor
          await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
            method: 'DELETE'
          });
          
          setIsSubscribed(false);
        }
      } else {
        // Obter chave pública VAPID
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        
        if (!vapidPublicKey) {
          throw new Error('Chave VAPID não configurada');
        }
        
        // Converter chave base64 para Uint8Array
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Criar nova inscrição
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        
        // Enviar para o servidor
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription
          }),
        });
        
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Erro ao gerenciar inscrição push:', err);
      setError(
        isSubscribed 
          ? 'Falha ao cancelar notificações' 
          : 'Falha ao ativar notificações. Verifique as permissões do navegador.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Se usuário não estiver autenticado ou navegador não suportar, não mostrar nada
  if (!session || !isSupported) {
    return null;
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

// Função para converter a chave VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
} 