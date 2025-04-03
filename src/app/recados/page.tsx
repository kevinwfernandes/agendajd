"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [novoRecadoGlobal, setNovoRecadoGlobal] = useState(false);
  const [novoRecadoClasse, setNovoRecadoClasse] = useState<number | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
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
      fetchClasses();
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
  
  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar classes');
      }
      
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Erro ao carregar classes:', error);
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
          global: novoRecadoGlobal,
          classeId: novoRecadoClasse
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
      setNovoRecadoGlobal(false);
      setNovoRecadoClasse(null);
      
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
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jd-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-jd-primary mb-8">Mural de Recados</h1>
      
      {/* Formulário para novo recado */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Publicar um Recado</h2>
        
        <form onSubmit={handleSubmitRecado}>
          <div className="mb-4">
            <label htmlFor="texto" className="block text-gray-700 text-sm font-bold mb-2">
              Texto do Recado
            </label>
            <textarea
              id="texto"
              value={novoRecadoTexto}
              onChange={(e) => setNovoRecadoTexto(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-jd-primary"
              rows={4}
              placeholder="Digite seu recado aqui..."
              required
            />
          </div>
          
          {isAdmin() && (
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="classe" className="block text-gray-700 text-sm font-bold mb-2">
                  Visibilidade da Classe
                </label>
                <select
                  id="classe"
                  value={novoRecadoClasse || 0}
                  onChange={(e) => setNovoRecadoClasse(Number(e.target.value) || null)}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-jd-primary"
                  disabled={novoRecadoGlobal}
                >
                  <option value={0}>Selecione uma classe</option>
                  {classes.map((classe) => (
                    <option key={classe.id} value={classe.id}>
                      {classe.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center mt-6">
                <input
                  id="global"
                  type="checkbox"
                  checked={novoRecadoGlobal}
                  onChange={(e) => setNovoRecadoGlobal(e.target.checked)}
                  className="h-4 w-4 text-jd-primary focus:ring-jd-primary border-gray-300 rounded"
                />
                <label htmlFor="global" className="ml-2 block text-gray-700">
                  Recado Global (visível para todos)
                </label>
              </div>
            </div>
          )}
          
          {mensagem && (
            <div className={`mb-4 p-3 rounded ${mensagem.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {mensagem.texto}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-jd-primary hover:bg-jd-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              disabled={enviandoRecado}
            >
              {enviandoRecado ? 'Publicando...' : 'Publicar Recado'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Lista de recados */}
      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jd-primary"></div>
        </div>
      ) : recados.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Nenhum recado encontrado.
        </div>
      ) : (
        <div className="space-y-6">
          {recados.map((recado) => (
            <div key={recado.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6">
                {/* Cabeçalho do recado */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    {recado.autor?.image && (
                      <img
                        src={recado.autor.image}
                        alt={recado.autor.name || 'Avatar'}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{recado.autor?.name || 'Usuário'}</div>
                      <div className="text-xs text-gray-500 flex items-center">
                        {formatarTipoUsuario(recado.autor?.tipoUsuario)}
                        {recado.classe && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{recado.classe.nome}</span>
                          </>
                        )}
                        {recado.global && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="text-jd-primary font-semibold">Global</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatarData(recado.data)}
                  </div>
                </div>
                
                {/* Conteúdo do recado */}
                <div className="text-gray-800 whitespace-pre-line mb-4">
                  {recado.texto}
                </div>
                
                {/* Botão para mostrar/esconder comentários */}
                <button
                  onClick={() => toggleComentarios(recado.id)}
                  className="text-jd-secondary hover:text-jd-secondary-dark text-sm font-medium"
                >
                  {recado.showComments ? 'Esconder comentários' : `${recado.comentarios ? recado.comentarios.length : 'Ver'} comentários`}
                </button>
              </div>
              
              {/* Seção de comentários */}
              {recado.showComments && (
                <div className="bg-gray-50 p-4 border-t">
                  {/* Lista de comentários */}
                  {recado.comentarios && recado.comentarios.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {recado.comentarios.map((comentario) => (
                        <div key={comentario.id} className="flex space-x-3">
                          {comentario.autor?.image && (
                            <img
                              src={comentario.autor.image}
                              alt={comentario.autor.name || 'Avatar'}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div className="flex-1">
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <div className="font-medium">{comentario.autor?.name || 'Usuário'}</div>
                              <div className="text-sm text-gray-800">{comentario.texto}</div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatarData(comentario.data)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-2 text-gray-500 text-sm">
                      Nenhum comentário ainda.
                    </div>
                  )}
                  
                  {/* Formulário para adicionar comentário */}
                  <div className="flex space-x-3 mt-4">
                    {session?.user?.image && (
                      <img
                        src={session.user.image}
                        alt={session.user.name || 'Avatar'}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div className="flex-1 flex">
                      <input
                        type="text"
                        value={novoComentarioTexto[recado.id] || ''}
                        onChange={(e) => handleComentarioChange(recado.id, e.target.value)}
                        placeholder="Escreva um comentário..."
                        className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-jd-secondary"
                      />
                      <button
                        onClick={() => submitComentario(recado.id)}
                        disabled={recado.isSubmittingComment || !novoComentarioTexto[recado.id]?.trim()}
                        className="bg-jd-secondary hover:bg-jd-secondary-dark text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
                      >
                        {recado.isSubmittingComment ? '...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex justify-center space-x-2 mt-8">
              <button
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
                className="px-4 py-2 border rounded-md bg-white text-jd-primary hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-700">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
                className="px-4 py-2 border rounded-md bg-white text-jd-primary hover:bg-gray-50 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 