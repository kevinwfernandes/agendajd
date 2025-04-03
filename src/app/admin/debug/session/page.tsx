"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function DebugSessionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Buscar dados adicionais da API
  useEffect(() => {
    const fetchData = async () => {
      if (status === 'authenticated') {
        setLoading(true);
        try {
          const res = await fetch('/api/debug/session');
          const data = await res.json();
          setApiResponse(data);
        } catch (error) {
          console.error('Erro ao buscar dados:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [status]);

  const formatJson = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  if (status === 'loading' || loading) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informações de Depuração da Sessão
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Dados da sessão e usuário atual
            </p>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">Dados da Sessão (Client-side)</h4>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {formatJson(session)}
            </pre>
          </div>

          {apiResponse && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h4 className="text-md font-medium text-gray-900 mb-2">Dados da API (Server-side)</h4>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
                {formatJson(apiResponse)}
              </pre>
            </div>
          )}

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6 text-center">
            <button
              onClick={() => router.push('/admin/usuarios')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jd-primary hover:bg-jd-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jd-primary"
            >
              Ir para Gerenciamento de Usuários
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 