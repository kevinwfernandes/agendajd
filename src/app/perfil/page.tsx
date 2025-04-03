"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PushNotificationManager } from '@/components/PushNotificationManager';

export default function PerfilPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Registrar service worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          setIsRegistering(true);
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registrado com sucesso:', registration);
        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        } finally {
          setIsRegistering(false);
        }
      }
    };

    registerServiceWorker();
  }, []);

  if (status === 'loading' || isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jd-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-jd-primary mb-6">Meu Perfil</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Informações Pessoais</h2>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">Nome</p>
            <p className="font-medium">{session.user.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">E-mail</p>
            <p className="font-medium">{session.user.email}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500">Perfil</p>
            <p className="font-medium">{formatTipoUsuario(session.user.tipoUsuario)}</p>
          </div>
          
          {session.user.classeId && (
            <div>
              <p className="text-sm text-gray-500">Classe</p>
              <p className="font-medium">ID: {session.user.classeId}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferências</h2>
        
        {/* Componente para gerenciar notificações push */}
        <PushNotificationManager />
        
        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">Alterar Senha</p>
          <button 
            className="px-4 py-2 bg-jd-primary text-white rounded-md hover:bg-jd-primary-dark transition-colors"
            onClick={() => router.push('/alterar-senha')}
          >
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
}

// Função para formatar o tipo de usuário
function formatTipoUsuario(tipo: string | undefined): string {
  if (!tipo) return 'Não definido';
  
  const formatMap: Record<string, string> = {
    'MACOM_ADMIN_GERAL': 'Administrador Geral',
    'ADMIN_DM': 'Administrador DeMolay',
    'ADMIN_FDJ': 'Administrador Filhas de Jó',
    'ADMIN_FRATERNA': 'Administrador Fraterna',
    'MACOM': 'Maçom',
    'MEMBRO_DM': 'Membro DeMolay',
    'MEMBRO_FDJ': 'Membro Filhas de Jó',
    'MEMBRO_FRATERNA': 'Membro Fraterna'
  };
  
  return formatMap[tipo] || tipo;
} 