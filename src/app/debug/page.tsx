"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/Navbar';

// Tipos para estado
interface PushSubscriptionData {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface TestResult {
  message?: string;
  error?: string;
  results?: Array<{
    status: string;
    value?: {
      success: boolean;
      status?: number;
      error?: string;
      subscription?: string;
    };
    reason?: string;
  }>;
}

export default function DebugPage() {
  const { data: session } = useSession();
  const [logs, setLogs] = useState<string[]>([]);
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Adicionar log à lista
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].slice(0, -1)}: ${message}`]);
  };

  // Verificar configuração quando a página carregar
  useEffect(() => {
    // Verificar chave VAPID
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    setVapidKey(publicKey || null);
    addLog(`Chave VAPID: ${publicKey ? 'Configurada' : 'Não configurada'}`);

    // Verificar suporte a service worker
    if (!('serviceWorker' in navigator)) {
      addLog('❌ Service Worker não suportado neste navegador');
      return;
    }
    
    addLog('✅ Service Worker suportado neste navegador');

    // Verificar suporte a Push API
    if (!('PushManager' in window)) {
      addLog('❌ Push API não suportada neste navegador');
      return;
    }
    
    addLog('✅ Push API suportada neste navegador');

    // Verificar registro do Service Worker
    navigator.serviceWorker.getRegistration()
      .then(registration => {
        if (registration) {
          addLog(`✅ Service Worker registrado: ${registration.scope}`);
          
          // Verificar status da inscrição
          registration.pushManager.getSubscription()
            .then(sub => {
              if (sub) {
                addLog(`✅ Inscrição push ativa: ${sub.endpoint.substring(0, 50)}...`);
                // Converter para o formato que podemos armazenar no estado
                const subData: PushSubscriptionData = {
                  endpoint: sub.endpoint,
                  expirationTime: sub.expirationTime,
                  keys: {
                    p256dh: '',
                    auth: ''
                  }
                };
                
                // Keys é uma propriedade estendida por PushManager, precisamos de um cast
                const subWithKeys = sub.toJSON() as unknown as {
                  keys: { p256dh: string; auth: string };
                };
                
                if (subWithKeys.keys) {
                  subData.keys = subWithKeys.keys;
                }
                
                setSubscription(subData);
              } else {
                addLog('ℹ️ Nenhuma inscrição push ativa');
              }
            })
            .catch(err => {
              addLog(`❌ Erro ao verificar inscrição: ${err.message}`);
            });
        } else {
          addLog('❌ Service Worker não registrado');
          
          // Tentar registrar o service worker
          addLog('🔄 Tentando registrar o service worker...');
          navigator.serviceWorker.register('/sw.js')
            .then(reg => {
              addLog(`✅ Service Worker registrado: ${reg.scope}`);
            })
            .catch(err => {
              addLog(`❌ Falha ao registrar o service worker: ${err.message}`);
            });
        }
      })
      .catch(err => {
        addLog(`❌ Erro ao verificar registro: ${err.message}`);
      });

    // Verificar permissão para notificações
    if ('Notification' in window) {
      addLog(`ℹ️ Status da permissão de notificação: ${Notification.permission}`);
    } else {
      addLog('❌ API de Notificações não suportada');
    }
  }, []);

  // Testar envio de notificação
  const testNotification = async () => {
    setLoading(true);
    addLog('🔄 Testando envio de notificação...');
    
    try {
      const response = await fetch('/api/push/test');
      const data = await response.json() as TestResult;
      
      setTestResult(data);
      
      if (response.ok) {
        addLog(`✅ Teste enviado: ${data.message}`);
        if (data.results) {
          data.results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              const value = result.value;
              if (value) {
                addLog(`✅ Notificação ${index + 1}: ${value.success ? 'Enviada' : 'Falhou'} (${value.status || value.error})`);
              }
            } else {
              addLog(`❌ Notificação ${index + 1} falhou: ${result.reason}`);
            }
          });
        }
      } else {
        addLog(`❌ Erro no teste: ${data.error || 'Desconhecido'}`);
      }
    } catch (error) {
      addLog(`❌ Exceção: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar permissão para notificações
  const requestPermission = async () => {
    setLoading(true);
    addLog('🔄 Solicitando permissão para notificações...');
    
    try {
      const permission = await Notification.requestPermission();
      addLog(`ℹ️ Resultado da solicitação: ${permission}`);
    } catch (error) {
      addLog(`❌ Erro ao solicitar permissão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-jd-light flex flex-col">
      <Navbar />
      
      <header className="bg-jd-dark text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">Página de Debug</h1>
          <p>Ferramenta para diagnóstico de notificações push</p>
        </div>
      </header>
      
      <div className="flex-grow container mx-auto p-4 md:p-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Configuração</h2>
          <p className="mb-2">
            <strong>Status do Service Worker:</strong> {typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? '✅ Suportado' : '❌ Não suportado'}
          </p>
          <p className="mb-2">
            <strong>Status da Push API:</strong> {typeof window !== 'undefined' && 'PushManager' in window ? '✅ Suportada' : '❌ Não suportada'}
          </p>
          <p className="mb-2">
            <strong>Status das Notificações:</strong> {typeof window !== 'undefined' && 'Notification' in window ? `ℹ️ ${Notification.permission}` : '❌ Não suportadas'}
          </p>
          <p className="mb-2">
            <strong>Chave VAPID:</strong> {vapidKey ? '✅ Configurada' : '❌ Não configurada'}
          </p>
          {vapidKey && (
            <p className="mb-2 text-xs break-all">
              <strong>Valor:</strong> {vapidKey}
            </p>
          )}
          
          <div className="mt-4 space-x-2">
            <button
              onClick={requestPermission}
              disabled={loading || typeof window === 'undefined' || !('Notification' in window)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Solicitar Permissão
            </button>
            
            <button
              onClick={testNotification}
              disabled={loading || !session}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Testar Notificação
            </button>
          </div>
        </div>
        
        {testResult && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Resultado do Teste</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
        
        {subscription && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2">Detalhes da Inscrição</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
              {JSON.stringify(subscription, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-xl font-semibold mb-2">Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto h-80">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
          </div>
        </div>
      </div>
      
      <footer className="bg-jd-dark text-white p-4 text-center">
        <p className="text-sm">
          Esta página é apenas para fins de diagnóstico e teste.
        </p>
      </footer>
    </main>
  );
} 