"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { PushNotificationManager } from '@/components/PushNotificationManager';
import { Classe } from '@prisma/client';

export default function PerfilPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [classeId, setClasseId] = useState<number | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  
  // Registrar service worker para notificações push
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registrado:', registration);
        })
        .catch(error => {
          console.error('Erro ao registrar Service Worker:', error);
        });
    }
  }, []);
  
  // Verificar autenticação e carregar dados do usuário
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setName(session.user.name || '');
      setClasseId(session.user.classeId || null);
      fetchClasses();
      setLoading(false);
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);
  
  // Carregar classes disponíveis
  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Erro ao carregar classes:', error);
    }
  };
  
  // Formatar o tipo de usuário para exibição
  const formatTipoUsuario = (tipo: string | undefined) => {
    if (!tipo) return 'Não definido';
    
    const tiposFormatados: Record<string, string> = {
      'MACOM_ADMIN_GERAL': 'Administrador Geral',
      'ADMIN_DM': 'Administrador DeMolay',
      'ADMIN_FDJ': 'Administrador Filhas de Jó',
      'ADMIN_FRATERNA': 'Administrador Fraternidade',
      'MACOM': 'Maçom',
      'MEMBRO_DM': 'DeMolay',
      'MEMBRO_FDJ': 'Filha de Jó',
      'MEMBRO_FRATERNA': 'Fraterna'
    };
    
    return tiposFormatados[tipo] || tipo;
  };
  
  // Salvar alterações do perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await fetch('/api/usuarios/editar-proprio-perfil', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          classeId: classeId === 0 ? null : classeId // Tratar "Nenhuma" como null
        }),
      });
      
      if (response.ok) {
        // Atualizar dados da sessão após sucesso
        setMessage({ text: 'Perfil atualizado com sucesso!', type: 'success' });
        update();
      } else {
        const errorData = await response.json();
        setMessage({ text: errorData.message || 'Erro ao atualizar perfil', type: 'error' });
      }
    } catch (err) {
      console.error('Erro na API:', err);
      setMessage({ text: 'Erro ao conectar com o servidor', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse flex justify-center items-center h-64">
            <p className="text-xl text-jd-primary">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu Perfil</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
          
          <form onSubmit={handleSaveProfile}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                Nome
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">O email não pode ser alterado.</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="tipoUsuario">
                Tipo de Usuário
              </label>
              <input
                id="tipoUsuario"
                type="text"
                value={formatTipoUsuario(session?.user?.tipoUsuario as string)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                disabled
              />
              <p className="text-sm text-gray-500 mt-1">O tipo de usuário só pode ser alterado por um administrador.</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="classe">
                Classe
              </label>
              <select
                id="classe"
                value={classeId || 0}
                onChange={(e) => setClasseId(Number(e.target.value) || null)}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Nenhuma</option>
                {classes.map((classe) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.nome}
                  </option>
                ))}
              </select>
            </div>
            
            {message.text && (
              <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {message.text}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-jd-primary hover:bg-jd-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Notificações Push</h2>
          <PushNotificationManager />
        </div>
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Segurança</h2>
          <p className="mb-4 text-gray-600">
            Você pode alterar sua senha a qualquer momento para manter sua conta segura.
          </p>
          <button
            onClick={() => router.push('/alterar-senha')}
            className="bg-jd-secondary hover:bg-jd-secondary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
          >
            Alterar Senha
          </button>
        </div>
      </div>
    </div>
  );
} 