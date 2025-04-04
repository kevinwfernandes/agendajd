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
}

interface Comentario {
  id: number;
  texto: string;
  data: string;
  autorId: string;
  recadoId: number;
  autor?: Autor;
}

export default function RecadosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recados, setRecados] = useState<Recado[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoRecadoTexto, setNovoRecadoTexto] = useState('');
  const [enviandoRecado, setEnviandoRecado] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: 'success' | 'error' } | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [novoComentarioTexto, setNovoComentarioTexto] = useState<Record<number, string>>({});
  
  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Carregar recados
  useEffect(() => {
    if (status === 'authenticated') {
      fetchRecados();
    }
  }, [status, paginaAtual]);
  
  const fetchRecados = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recados?page=${paginaAtual}&limit=10`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar recados');
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
    } catch (error) {
      console.error('Erro ao carregar recados:', error);
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
      
      const response = await fetch('/api/recados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: novoRecadoTexto,
          global: true // Todos os recados são globais (visíveis para todos)
        }),
      });
      
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
      
      // Limpar formulário
      setNovoRecadoTexto('');
      
      setMensagem({
        texto: 'Recado publicado com sucesso!',
        tipo: 'success'
      });
    } catch (error) {
      console.error('Erro ao criar recado:', error);
      setMensagem({
        texto: error instanceof Error ? error.message : 'Erro ao publicar recado',
        tipo: 'error'
      });
    } finally {
      setEnviandoRecado(false);
    }
  };
  
  const toggleComentarios = async (recadoId: number) => {
    // Buscar comentários se ainda não estiverem carregados
    const recadoIndex = recados.findIndex(r => r.id === recadoId);
    
    if (recadoIndex === -1) return;
    
    const recado = recados[recadoIndex];
    
    // Se já tem comentários, apenas alternar a visibilidade
    if (recado.comentarios) {
      const updatedRecados = [...recados];
      updatedRecados[recadoIndex] = {
        ...recado,
        showComments: !recado.showComments
      };
      setRecados(updatedRecados);
      return;
    }
    
    // Se não tem comentários, buscar do servidor
    try {
      const response = await fetch(`/api/recados/${recadoId}/comentarios`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar comentários');
      }
      
      const comentarios = await response.json();
      
      // Atualizar o recado com os comentários
      const updatedRecados = [...recados];
      updatedRecados[recadoIndex] = {
        ...recado,
        comentarios,
        showComments: true
      };
      
      setRecados(updatedRecados);
    } catch (error) {
      console.error(`Erro ao carregar comentários do recado ${recadoId}:`, error);
      // Mostrar mensagem de erro
    }
  };
  
  const handleComentarioChange = (recadoId: number, texto: string) => {
    setNovoComentarioTexto({
      ...novoComentarioTexto,
      [recadoId]: texto
    });
  };
  
  const submitComentario = async (recadoId: number) => {
    const texto = novoComentarioTexto[recadoId];
    
    if (!texto || texto.trim() === '') {
      return;
    }
    
    const recadoIndex = recados.findIndex(r => r.id === recadoId);
    if (recadoIndex === -1) return;
    
    // Atualizar estado para mostrar loading
    const updatedRecados = [...recados];
    updatedRecados[recadoIndex] = {
      ...updatedRecados[recadoIndex],
      isSubmittingComment: true
    };
    setRecados(updatedRecados);
    
    try {
      const response = await fetch(`/api/recados/${recadoId}/comentarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ texto }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar comentário');
      }
      
      const novoComentario = await response.json();
      
      // Adicionar o novo comentário à lista
      const recadoAtualizado = {
        ...updatedRecados[recadoIndex],
        isSubmittingComment: false,
        comentarios: [
          ...(updatedRecados[recadoIndex].comentarios || []),
          novoComentario
        ]
      };
      
      updatedRecados[recadoIndex] = recadoAtualizado;
      setRecados(updatedRecados);
      
      // Limpar o campo de texto
      setNovoComentarioTexto({
        ...novoComentarioTexto,
        [recadoId]: ''
      });
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      
      // Retirar estado de loading
      const recadosAtualizados = [...recados];
      recadosAtualizados[recadoIndex] = {
        ...recadosAtualizados[recadoIndex],
        isSubmittingComment: false
      };
      setRecados(recadosAtualizados);
    }
  };
  
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    } catch (error) {
      return dataString;
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
  
  // Adicionar função para excluir recado
  const excluirRecado = async (recadoId: number) => {
    if (!confirm('Tem certeza que deseja excluir este recado? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/recados/${recadoId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir recado');
      }
      
      // Remover recado da lista
      setRecados(recados.filter(r => r.id !== recadoId));
      
      setMensagem({
        texto: 'Recado excluído com sucesso!',
        tipo: 'success'
      });
      
      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMensagem(null);
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir recado:', error);
      setMensagem({
        texto: 'Erro ao excluir recado. Tente novamente.',
        tipo: 'error'
      });
    }
  };
  
  // Adicionar função para excluir comentário
  const excluirComentario = async (recadoId: number, comentarioId: number) => {
    if (!confirm('Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/recados/${recadoId}/comentarios/${comentarioId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir comentário');
      }
      
      // Atualizar recado na lista removendo o comentário
      setRecados(prevRecados => {
        return prevRecados.map(recado => {
          if (recado.id === recadoId && recado.comentarios) {
            return {
              ...recado,
              comentarios: recado.comentarios.filter(c => c.id !== comentarioId)
            };
          }
          return recado;
        });
      });
      
    } catch (error) {
      console.error('Erro ao excluir comentário:', error);
      alert('Erro ao excluir comentário. Tente novamente.');
    }
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
        <h1 className="text-2xl font-bold text-jd-primary mb-6">Mural de Recados</h1>
        
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
                mensagem.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
                  const isRecadoAutor = session?.user?.id === recado.autorId;
                  
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
                          
                          {/* Botão de excluir recado */}
                          {(session?.user?.id === recado.autorId || ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(session?.user?.tipoUsuario as string)) && (
                            <button 
                              onClick={() => excluirRecado(recado.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                              title="Excluir recado"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                        
                        <p className="text-gray-700 whitespace-pre-wrap">{recado.texto}</p>
                        
                        <div className="mt-3 flex justify-between items-center">
                          <button
                            onClick={() => toggleComentarios(recado.id)}
                            className="text-sm text-jd-primary hover:text-jd-primary-dark"
                          >
                            {recado.showComments ? 'Ocultar comentários' : `Comentários (${recado.comentarios?.length || 0})`}
                          </button>
                        </div>
                      </div>
                      
                      {recado.showComments && (
                        <div className="border-t border-gray-200">
                          {/* Comentários existentes */}
                          <div className="px-4 py-2 bg-gray-50">
                            {recado.comentarios && recado.comentarios.length > 0 ? (
                              <div className="space-y-3">
                                {recado.comentarios.map(comentario => {
                                  const dataComentario = new Date(comentario.data);
                                  const formattedCommentDate = format(
                                    dataComentario,
                                    "dd/MM/yyyy 'às' HH:mm",
                                    { locale: ptBR }
                                  );
                                  
                                  const podeExcluirComentario = 
                                    session?.user?.id === comentario.autorId || // Autor do comentário
                                    session?.user?.id === recado.autorId || // Autor do recado
                                    ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(session?.user?.tipoUsuario as string); // Admin
                                  
                                  return (
                                    <div key={comentario.id} className="pb-2 border-b border-gray-200 last:border-0">
                                      <div className="flex justify-between items-start">
                                        <p className="font-medium text-sm">
                                          {comentario.autor?.name || 'Usuário'}
                                          <span className="text-xs ml-1 text-gray-500">
                                            ({formatarTipoUsuario(comentario.autor?.tipoUsuario)})
                                          </span>
                                        </p>
                                        <div className="flex items-center">
                                          <p className="text-xs text-gray-500 mr-2">{formattedCommentDate}</p>
                                          
                                          {/* Botão de excluir comentário */}
                                          {podeExcluirComentario && (
                                            <button 
                                              onClick={() => excluirComentario(recado.id, comentario.id)}
                                              className="text-red-500 hover:text-red-700 text-xs"
                                              title="Excluir comentário"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                              </svg>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700 mt-1">{comentario.texto}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 py-2">Nenhum comentário ainda.</p>
                            )}
                          </div>
                          
                          {/* Formulário para adicionar comentário */}
                          <div className="p-3 bg-gray-50 border-t border-gray-200">
                            <div className="flex">
                              <input
                                type="text"
                                value={novoComentarioTexto[recado.id] || ''}
                                onChange={(e) => handleComentarioChange(recado.id, e.target.value)}
                                placeholder="Escreva um comentário..."
                                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-jd-primary text-sm"
                              />
                              <button
                                onClick={() => submitComentario(recado.id)}
                                disabled={recado.isSubmittingComment || !novoComentarioTexto[recado.id]?.trim()}
                                className={`px-3 bg-jd-primary text-white rounded-r-md hover:bg-jd-primary-dark transition-colors ${
                                  recado.isSubmittingComment || !novoComentarioTexto[recado.id]?.trim()
                                    ? 'opacity-70 cursor-not-allowed'
                                    : ''
                                }`}
                              >
                                {recado.isSubmittingComment ? '...' : 'Enviar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
                Mural de Recados
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