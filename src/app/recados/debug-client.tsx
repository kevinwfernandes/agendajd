"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Navbar from '@/components/Navbar';

interface Autor {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  tipoUsuario?: string;
}

interface Classe {
  id: number;
  nome: string;
}

interface Recado {
  id: number;
  texto: string;
  data: string;
  global: boolean;
  autorId: string;
  autor?: Autor;
  classeId?: number | null;
  classe?: Classe | null;
  comentarios?: Comentario[];
  showComments?: boolean; // controle de UI
  isSubmittingComment?: boolean; // controle de UI
  comentariosCount?: number;
}

interface Comentario {
  id: number;
  texto: string;
  data: string;
  autorId: string;
  recadoId: number;
  autor?: Autor;
}

export default function RecadosDebugClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recados, setRecados] = useState<Recado[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoRecadoTexto, setNovoRecadoTexto] = useState('');
  const [enviandoRecado, setEnviandoRecado] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'success' | 'error' | 'info' } | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [novoComentarioTexto, setNovoComentarioTexto] = useState<Record<number, string>>({});
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [debugMode, setDebugMode] = useState<boolean>(true);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Carregar recados
  useEffect(() => {
    if (status === 'authenticated') {
      if (debugMode) {
        fetchRecadosDebug();
      } else {
        fetchRecadosNormal();
      }
    }
  }, [status, paginaAtual, debugMode]);
  
  const fetchRecadosDebug = async () => {
    setLoading(true);
    setErrorDetails(null);
    setDebugLogs([]);
    
    try {
      // Usar o endpoint com logs de debug
      const response = await fetch(`/api/recados-debug-list?page=${paginaAtual}&limit=10`);
      
      // Mesmo se a resposta não for OK, tentamos extrair os logs
      const data = await response.json();
      
      // Salvar logs para diagnóstico
      if (data.logs) {
        setDebugLogs(data.logs);
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao carregar recados');
      }
      
      // Se chegou aqui, processamos os dados normalmente
      const recadosComUI = data.recados.map((recado: Recado) => ({
        ...recado,
        showComments: false,
        isSubmittingComment: false,
        data: new Date(recado.data).toISOString() // garantir formato consistente
      }));
      
      setRecados(recadosComUI);
      setTotalPaginas(Math.ceil(data.total / 10));
      setMensagem({
        texto: `${data.recados.length} recados carregados com sucesso (modo debug)`,
        tipo: 'success'
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMensagem(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao carregar recados (debug):', error);
      
      if (error instanceof Error) {
        setErrorDetails(error.message);
      }
      
      setMensagem({
        texto: 'Não foi possível carregar os recados. Verifique os logs de depuração.',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecadosNormal = async () => {
    setLoading(true);
    setErrorDetails(null);
    setDebugLogs([]);
    
    try {
      const response = await fetch(`/api/recados?page=${paginaAtual}&limit=10`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao carregar recados');
      }
      
      const data = await response.json();
      
      // Adicionar propriedades de UI aos recados
      const recadosComUI = data.recados.map((recado: Recado) => ({
        ...recado,
        showComments: false,
        isSubmittingComment: false,
        data: new Date(recado.data).toISOString() // garantir formato consistente
      }));
      
      setRecados(recadosComUI);
      setTotalPaginas(Math.ceil(data.total / 10));
      setMensagem({
        texto: `${data.recados.length} recados carregados com sucesso`,
        tipo: 'success'
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMensagem(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao carregar recados:', error);
      
      if (error instanceof Error) {
        setErrorDetails(error.message);
      }
      
      setMensagem({
        texto: 'Não foi possível carregar os recados. Tente novamente mais tarde.',
        tipo: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitRecado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoRecadoTexto.trim()) {
      setMensagem({
        texto: 'O texto do recado não pode estar vazio',
        tipo: 'error'
      });
      return;
    }
    
    try {
      setEnviandoRecado(true);
      setMensagem(null);
      
      // Usar endpoint de debug ou normal dependendo do modo
      const endpoint = debugMode ? '/api/recados-debug' : '/api/recados';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: novoRecadoTexto,
          global: true // Todos os recados são globais (visíveis para todos)
        }),
      });
      
      // Para o modo debug, sempre capturar os logs mesmo em caso de erro
      if (debugMode) {
        const data = await response.json();
        
        if (data.logs) {
          setDebugLogs(data.logs);
        }
        
        if (!response.ok) {
          throw new Error(data.message || 'Erro ao criar recado');
        }
        
        // Se estiver no modo debug, recarregamos os recados para garantir consistência
        await fetchRecadosDebug();
      } else {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar recado');
        }
        
        const novoRecado = await response.json();
        
        // Adicionar o novo recado à lista e ordenar por data (mais recente primeiro)
        setRecados([
          {
            ...novoRecado,
            showComments: false,
            isSubmittingComment: false,
            data: new Date(novoRecado.data).toISOString()
          },
          ...recados
        ]);
      }
      
      // Limpar formulário
      setNovoRecadoTexto('');
      
      setMensagem({
        texto: 'Recado publicado com sucesso!',
        tipo: 'success'
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMensagem(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao criar recado:', error);
      
      if (error instanceof Error) {
        setErrorDetails(error.message);
      }
      
      setMensagem({
        texto: error instanceof Error ? error.message : 'Erro ao publicar recado',
        tipo: 'error'
      });
    } finally {
      setEnviandoRecado(false);
    }
  };
  
  // Formatar tipo de usuário
  const formatarTipoUsuario = (tipo?: string) => {
    if (!tipo) return '';
    
    const tipos: Record<string, string> = {
      'MACOM_ADMIN_GERAL': 'Administrador Geral',
      'ADMIN_DM': 'Administrador DeMolay',
      'ADMIN_FDJ': 'Administrador Filhas de Jó',
      'ADMIN_FRATERNA': 'Administrador Fraternidade',
      'MACOM': 'Maçom',
      'MEMBRO_DM': 'DeMolay',
      'MEMBRO_FDJ': 'Filha de Jó',
      'MEMBRO_FRATERNA': 'Fraterna'
    };
    
    return tipos[tipo] || tipo;
  };
  
  // Verificar se o usuário é administrador
  const isAdmin = () => {
    if (!session || !session.user) return false;
    
    const adminTypes = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA', 'MACOM'];
    return adminTypes.includes(session.user.tipoUsuario as string);
  };
  
  // Formatar logs para exibição
  const formatLogs = (logs: any[]) => {
    if (!logs || logs.length === 0) {
      return "Nenhum log disponível";
    }
    
    return logs.map((log, index) => {
      // Omitir o timestamp para ficar mais limpo
      const { timestamp, ...rest } = log;
      const timeStr = new Date(timestamp).toLocaleTimeString();
      
      return `${index + 1}. [${timeStr}] ${log.evento}\n${JSON.stringify(rest, null, 2)}\n`;
    }).join("\n");
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jd-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-jd-light flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-jd-primary">Mural de Recados (Modo Diagnóstico)</h1>
          <div className="flex items-center">
            <span className="mr-2 text-sm">Modo:</span>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-3 py-1 rounded-md text-white text-sm ${
                debugMode ? 'bg-green-600' : 'bg-blue-600'
              }`}
            >
              {debugMode ? 'Debug Ativo' : 'Normal'}
            </button>
          </div>
        </div>
        
        {/* Formulário para adicionar novo recado */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-8">
          <h2 className="text-xl font-semibold mb-3">Publicar um recado</h2>
          
          <form onSubmit={handleSubmitRecado}>
            <div className="mb-4">
              <textarea
                value={novoRecadoTexto}
                onChange={(e) => setNovoRecadoTexto(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-jd-primary"
                rows={3}
                placeholder="Digite sua mensagem..."
                required
              />
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex items-center">
                <p className="text-sm text-gray-700">
                  Todos os recados publicados são visíveis para todos os membros.
                </p>
              </div>
            </div>
            
            {mensagem && (
              <div className={`p-3 mb-4 rounded-md ${
                mensagem.tipo === 'success' ? 'bg-green-100 text-green-800' : 
                mensagem.tipo === 'info' ? 'bg-blue-100 text-blue-800' : 
                'bg-red-100 text-red-800'
              }`}>
                {mensagem.texto}
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={enviandoRecado}
                className={`px-4 py-2 bg-jd-primary text-white rounded-md hover:bg-jd-primary-dark transition-colors ${
                  enviandoRecado ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {enviandoRecado ? 'Publicando...' : 'Publicar Recado'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Seção de depuração */}
        {debugMode && debugLogs.length > 0 && (
          <div className="bg-gray-100 p-4 rounded-lg mb-6 overflow-hidden">
            <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
              <span>Logs de Diagnóstico</span>
              <button
                onClick={() => setDebugLogs([])}
                className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              >
                Limpar
              </button>
            </h2>
            <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-auto max-h-[200px]">
              {formatLogs(debugLogs)}
            </pre>
          </div>
        )}
        
        {/* Detalhes do erro */}
        {errorDetails && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Detalhes do Erro</h2>
            <pre className="text-sm text-red-600 whitespace-pre-wrap">
              {errorDetails}
            </pre>
          </div>
        )}
        
        {/* Lista de recados */}
        {loading ? (
          <div className="flex justify-center my-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jd-primary"></div>
          </div>
        ) : (
          <>
            {recados.length === 0 ? (
              <div className="bg-white shadow-md rounded-lg p-6 text-center">
                <p className="text-gray-500">Nenhum recado disponível no momento.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recados.map((recado) => {
                  const dataRecado = new Date(recado.data);
                  const formattedDate = format(dataRecado, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
                  
                  return (
                    <div key={recado.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-jd-primary">
                              {recado.autor?.name || 'Usuário'}
                              <span className="text-xs ml-2 text-gray-500">
                                {formatarTipoUsuario(recado.autor?.tipoUsuario)}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">{formattedDate}</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 whitespace-pre-wrap">{recado.texto}</p>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-sm text-gray-500">
                            {recado.comentariosCount 
                              ? `${recado.comentariosCount} comentário${recado.comentariosCount > 1 ? 's' : ''}` 
                              : 'Sem comentários'}
                          </span>
                          
                          {debugMode && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              ID: {recado.id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                    className={`px-3 py-1 rounded-l-md border border-gray-300 ${
                      paginaAtual === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-jd-primary hover:bg-gray-50'
                    }`}
                  >
                    Anterior
                  </button>
                  
                  {[...Array(totalPaginas)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPaginaAtual(i + 1)}
                      className={`px-3 py-1 border-t border-b border-gray-300 ${
                        paginaAtual === i + 1
                          ? 'bg-jd-primary text-white'
                          : 'bg-white text-jd-primary hover:bg-gray-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                    className={`px-3 py-1 rounded-r-md border border-gray-300 ${
                      paginaAtual === totalPaginas
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-jd-primary hover:bg-gray-50'
                    }`}
                  >
                    Próximo
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
      
      <footer className="bg-jd-dark text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-between items-center flex-wrap">
            <div className="text-center md:text-left">
              <h3 className="text-jd-accent text-xl font-bold">AgendaJD</h3>
              <p className="text-jd-secondary-dark">
                Mural de Recados (Modo Diagnóstico)
              </p>
            </div>
            <div className="mt-4 md:mt-0 w-full md:w-auto text-center">
              <p className="text-jd-secondary-dark">
                &copy; {new Date().getFullYear()} - Todos os direitos reservados
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 