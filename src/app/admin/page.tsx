"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Verificar autenticação e permissão
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex justify-center items-center h-64">
            <p className="text-xl text-jd-primary">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !session?.user) {
    router.push('/login');
    return null;
  }

  const userTipo = session.user.tipoUsuario as string;
  const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(userTipo);
  if (!isAdmin) {
    router.push('/');
    return null;
  }

  const sincronizarAniversarios = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    
    try {
      const response = await fetch('/api/aniversarios/sincronizar', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Aniversários sincronizados com sucesso!');
      } else {
        setError(data.error || 'Ocorreu um erro ao sincronizar aniversários');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro ao sincronizar aniversários:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-jd-primary">
              Painel Administrativo
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerenciamento do sistema AgendaJD
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
            <p>{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gerenciamento de Usuários */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciamento de Usuários</h3>
              <p className="text-gray-600 mb-4">Adicione, edite e gerencie usuários do sistema.</p>
              <Link href="/admin/usuarios" className="btn-primary block w-full text-center py-2 rounded">
                Acessar Usuários
              </Link>
            </div>
          </div>

          {/* Gerenciamento de Classes */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciamento de Classes</h3>
              <p className="text-gray-600 mb-4">Configure as classes do sistema (DM, FDJ, Fraterna).</p>
              <Link href="/admin/criar-classes" className="btn-primary block w-full text-center py-2 rounded">
                Acessar Classes
              </Link>
            </div>
          </div>

          {/* Aniversários no Calendário */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aniversários no Calendário</h3>
              <p className="text-gray-600 mb-4">Sincronize aniversários com o calendário de eventos.</p>
              <button
                onClick={sincronizarAniversarios}
                disabled={loading}
                className={`btn-primary block w-full text-center py-2 rounded ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Sincronizando...' : 'Sincronizar Aniversários'}
              </button>
            </div>
          </div>

          {/* Notificações */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notificações Push</h3>
              <p className="text-gray-600 mb-4">Gerencie e teste as notificações push do sistema.</p>
              <Link href="/admin/notificacoes" className="btn-primary block w-full text-center py-2 rounded">
                Acessar Notificações
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 