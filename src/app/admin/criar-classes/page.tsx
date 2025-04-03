"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';

// Classes predefinidas para o sistema
const classesPredefinidas = [
  {
    nome: "Sessão Maçônica",
    descricao: "Visível apenas para usuários maçons (admin, geral e maçons)"
  },
  {
    nome: "Reunião DeMolay",
    descricao: "Visível para DeMolays e maçons (admin ou não)"
  },
  {
    nome: "Reunião FDJ",
    descricao: "Visível para Filhas de Jó e maçons (admin ou não)"
  },
  {
    nome: "Reunião Fraterna",
    descricao: "Visível para Fraternas e maçons (admin ou não)"
  }
];

export default function CriarClassesPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    criadas: string[];
    existentes: string[];
    message?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const criarClasses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Primeiro, verificar classes existentes
      const responseClasses = await fetch('/api/admin/classes');
      if (!responseClasses.ok) {
        throw new Error('Falha ao buscar classes existentes');
      }
      
      const classesExistentes = await responseClasses.json();
      const nomesClassesExistentes = classesExistentes.map((c: { nome: string }) => c.nome);
      
      // Filtrar apenas as classes que não existem ainda
      const classesParaCriar = classesPredefinidas.filter(
        classe => !nomesClassesExistentes.includes(classe.nome)
      );
      
      if (classesParaCriar.length === 0) {
        setResult({
          message: "Todas as classes já existem no sistema",
          criadas: [],
          existentes: nomesClassesExistentes
        });
        return;
      }
      
      // Criar as classes que faltam
      const classesCriadas = [];
      
      for (const classe of classesParaCriar) {
        const response = await fetch('/api/admin/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classe)
        });
        
        if (response.ok) {
          const data = await response.json();
          classesCriadas.push(data.nome);
        } else {
          console.error(`Falha ao criar classe ${classe.nome}`);
        }
      }
      
      setResult({
        message: `${classesCriadas.length} classes criadas com sucesso`,
        criadas: classesCriadas,
        existentes: nomesClassesExistentes
      });
      
    } catch (err) {
      console.error('Erro:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Criar Classes Predefinidas</h1>
      
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
        
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Classes a serem criadas:</h3>
          <ul className="list-disc list-inside text-sm">
            {classesPredefinidas.map(classe => (
              <li key={classe.nome}>
                <span className="font-medium">{classe.nome}</span>: {classe.descricao}
              </li>
            ))}
          </ul>
        </div>
        
        <button
          onClick={criarClasses}
          disabled={isLoading || status !== 'authenticated'}
          className={`px-4 py-2 rounded ${
            status === 'authenticated'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Criando classes...' : 'Criar Classes'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
            <p className="text-green-700 mb-2">{result.message}</p>
            
            {result.criadas.length > 0 && (
              <div className="mb-2">
                <p className="font-medium">Classes criadas:</p>
                <ul className="list-disc list-inside text-sm">
                  {result.criadas.map(nome => (
                    <li key={nome}>{nome}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {result.existentes.length > 0 && (
              <div>
                <p className="font-medium">Classes já existentes:</p>
                <ul className="list-disc list-inside text-sm">
                  {result.existentes.map(nome => (
                    <li key={nome}>{nome}</li>
                  ))}
                </ul>
              </div>
            )}
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
      </div>
    </div>
  );
} 