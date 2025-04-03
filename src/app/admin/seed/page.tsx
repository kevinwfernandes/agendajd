"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

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

export default function AdminSeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message?: string;
    criadas?: string[];
    existentes?: string[];
    error?: string;
    tipoUsuario?: string;
  } | null>(null);

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Verificar se o usuário é MACOM_ADMIN_GERAL ou qualquer admin para teste
  const isAdmin = status === 'authenticated' && session?.user?.tipoUsuario && [
    'MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'
  ].includes(String(session.user.tipoUsuario));

  const inicializarClassesAPI = async () => {
    if (!isAdmin) {
      setMessage('Apenas administradores podem inicializar classes');
      return;
    }

    setIsLoading(true);
    setMessage('Inicializando classes via API...');

    try {
      const response = await fetch('/api/seed/classes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
      
      if (response.ok) {
        setMessage(data.message || 'Classes inicializadas com sucesso');
      } else {
        setMessage(data.error || 'Erro ao inicializar classes');
      }
    } catch (error) {
      console.error('Erro ao inicializar classes:', error);
      setMessage('Erro ao inicializar classes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar classes diretamente pelo cliente
  const criarClassesDiretamente = async () => {
    if (!isAdmin) {
      setMessage('Apenas administradores podem inicializar classes');
      return;
    }

    setIsLoading(true);
    setMessage('Criando classes diretamente...');

    try {
      // Buscar classes existentes para evitar duplicação
      const fetchClasses = await fetch('/api/admin/classes');
      const classesExistentes = await fetchClasses.json();
      const nomesClassesExistentes = classesExistentes.map((c: { nome: string }) => c.nome);
      
      // Filtrar apenas classes que não existem
      const classesParaCriar = classesPredefinidas.filter(
        c => !nomesClassesExistentes.includes(c.nome)
      );
      
      if (classesParaCriar.length === 0) {
        setResult({
          message: 'Todas as classes já existem no sistema',
          existentes: nomesClassesExistentes
        });
        setMessage('Todas as classes já existem no sistema');
        setIsLoading(false);
        return;
      }
      
      // Criar as classes que não existem
      const classesCriadas = [];
      
      for (const classe of classesParaCriar) {
        const response = await fetch('/api/admin/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(classe),
        });
        
        if (response.ok) {
          const novaClasse = await response.json();
          classesCriadas.push(novaClasse.nome);
        }
      }
      
      // Preparar resultado
      setResult({
        message: `${classesCriadas.length} classes criadas com sucesso`,
        criadas: classesCriadas,
        existentes: nomesClassesExistentes
      });
      
      setMessage(`${classesCriadas.length} classes criadas com sucesso`);
      
    } catch (error) {
      console.error('Erro ao criar classes:', error);
      setMessage('Erro ao criar classes. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-xl font-bold mb-4 text-center">Carregando...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-xl font-bold mb-4 text-center">Inicialização do Sistema</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Classes Predefinidas</h2>
          <p className="text-sm mb-4">
            Esta ação irá criar as classes predefinidas no sistema (Sessão Maçônica, Reunião DeMolay, etc.).
            Classes já existentes não serão duplicadas.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={inicializarClassesAPI}
              disabled={isLoading || !isAdmin}
              className={`w-full py-2 px-4 rounded ${
                isAdmin 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Inicializando...' : 'Método 1: Via API Seed'}
            </button>
            
            <button
              onClick={criarClassesDiretamente}
              disabled={isLoading || !isAdmin}
              className={`w-full py-2 px-4 rounded ${
                isAdmin 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isLoading ? 'Criando...' : 'Método 2: Criação Direta'}
            </button>
          </div>
          
          {!isAdmin && (
            <p className="mt-2 text-center text-red-500">
              Você não tem permissão para inicializar classes.<br />
              Tipo de usuário: {session?.user?.tipoUsuario || 'Não definido'}
            </p>
          )}
          
          {message && (
            <p className={`mt-2 text-center ${message.includes('Erro') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
          
          {result && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              {result.criadas && result.criadas.length > 0 && (
                <div className="mb-2">
                  <p className="font-medium">Classes criadas:</p>
                  <ul className="list-disc list-inside">
                    {result.criadas.map((classe) => (
                      <li key={classe}>{classe}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.existentes && result.existentes.length > 0 && (
                <div>
                  <p className="font-medium">Classes já existentes:</p>
                  <ul className="list-disc list-inside">
                    {result.existentes.map((classe) => (
                      <li key={classe}>{classe}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.tipoUsuario && (
                <p className="mt-2">
                  <span className="font-medium">Seu tipo de usuário:</span> {result.tipoUsuario}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between">
          <a 
            href="/admin"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Voltar para Admin
          </a>
          
          <a 
            href="/admin/debug/session"
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Debug da Sessão
          </a>
        </div>
      </div>
    </div>
  );
} 