"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function AtualizarUsuarioPage() {
  const { data: session, status, update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{message?: string; resultado?: string} | null>(null);
  const [error, setError] = useState<string | null>(null);

  const atualizarUsuario = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obter o email do usuário atual
      const email = session?.user?.email || 'admin@agendajd.com';
      
      // Usar a API específica para atualizar o tipo de usuário
      const response = await fetch('/api/admin/atualizar-usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email
        }),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar usuário');
      }
      
      const data = await response.json();
      setResult(data);
      
      // Atualizar a sessão para refletir a mudança
      update();
      
    } catch (err) {
      console.error('Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Atualizar para Administrador Geral</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Informações do Usuário</h2>
        
        {status === 'authenticated' ? (
          <div className="mb-4">
            <p><span className="font-medium">Nome:</span> {session.user.name}</p>
            <p><span className="font-medium">Email:</span> {session.user.email}</p>
            <p>
              <span className="font-medium">Tipo de Usuário:</span> {' '}
              {String(session.user.tipoUsuario) || 'Não definido'}
            </p>
          </div>
        ) : (
          <p className="mb-4 text-red-500">Você precisa estar autenticado para usar esta função.</p>
        )}
        
        <button
          onClick={atualizarUsuario}
          disabled={isLoading || status !== 'authenticated'}
          className={`px-4 py-2 rounded ${
            status === 'authenticated'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Atualizando...' : 'Atualizar para Administrador Geral'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-700 mb-2">Usuário atualizado com sucesso!</p>
            <p>Faça logout e login novamente para aplicar as alterações.</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 flex space-x-4">
        <a 
          href="/admin"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Voltar para Admin
        </a>
        <a 
          href="/admin/debug/session"
          className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
        >
          Debug da Sessão
        </a>
        <a 
          href="/admin/seed"
          className="bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded"
        >
          Inicializar Classes
        </a>
      </div>
    </div>
  );
} 