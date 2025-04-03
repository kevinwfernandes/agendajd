"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function SessionDebugPage() {
  const { data: session, status } = useSession();
  const [tipoUsuarioString, setTipoUsuarioString] = useState('');

  useEffect(() => {
    // Converter o tipo de usuário para string quando a sessão for carregada
    if (session?.user?.tipoUsuario) {
      setTipoUsuarioString(String(session.user.tipoUsuario));
    }
  }, [session]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug da Sessão</h1>
      
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Status da Sessão</h2>
        <div className="mb-2">
          <span className="font-medium">Status:</span> {status}
        </div>
        
        {status === 'authenticated' ? (
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            Usuário está autenticado
          </div>
        ) : status === 'loading' ? (
          <div className="p-3 bg-yellow-100 border border-yellow-300 rounded">
            Carregando sessão...
          </div>
        ) : (
          <div className="p-3 bg-red-100 border border-red-300 rounded">
            Usuário não está autenticado
          </div>
        )}
      </div>
      
      {session && (
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Dados da Sessão</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <span className="font-medium">ID:</span> {session.user.id || 'Não disponível'}
            </div>
            <div>
              <span className="font-medium">Nome:</span> {session.user.name || 'Não disponível'}
            </div>
            <div>
              <span className="font-medium">Email:</span> {session.user.email || 'Não disponível'}
            </div>
            <div>
              <span className="font-medium">Classe ID:</span> {session.user.classeId || 'Não definido'}
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
            <h3 className="font-semibold mb-2">Tipo de Usuário</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Valor:</span> {String(session.user.tipoUsuario) || 'Não definido'}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {typeof session.user.tipoUsuario}
              </div>
              <div>
                <span className="font-medium">String equivalente:</span> {tipoUsuarioString}
              </div>
              <div>
                <span className="font-medium">É Admin Geral?</span> {session.user.tipoUsuario === 'MACOM_ADMIN_GERAL' ? 'Sim' : 'Não'}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Objeto Session Completo</h3>
            <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      <div className="mt-6 flex space-x-4">
        <a 
          href="/admin"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Voltar para Admin
        </a>
        <a 
          href="/api/debug/session"
          target="_blank"
          rel="noopener noreferrer" 
          className="bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
        >
          Ver API de Sessão
        </a>
      </div>
    </div>
  );
} 