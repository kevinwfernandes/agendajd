"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { TipoUsuario } from '@prisma/client';

interface Classe {
  id: number;
  nome: string;
}

export default function AdminNotificacoesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [url, setUrl] = useState('');
  const [classeId, setClasseId] = useState<number | undefined>(undefined);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [usuarioIds, setUsuarioIds] = useState<string[]>([]);
  const [tipoNotificacao, setTipoNotificacao] = useState<'todos' | 'classe' | 'usuarios'>('todos');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Verificar autenticação e autorização
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated') {
      const userTipo = session?.user?.tipoUsuario as TipoUsuario;
      const isAdmin = userTipo === 'MACOM_ADMIN_GERAL' || 
                      userTipo === 'ADMIN_DM' || 
                      userTipo === 'ADMIN_FDJ' || 
                      userTipo === 'ADMIN_FRATERNA';
      
      if (!isAdmin) {
        router.push('/');
      }
    }
  }, [status, session, router]);
  
  // Carregar classes
  useEffect(() => {
    async function loadClasses() {
      try {
        const response = await fetch('/api/admin/classes');
        const data = await response.json();
        if (data && Array.isArray(data.classes)) {
          setClasses(data.classes);
        }
      } catch (error) {
        console.error('Erro ao carregar classes:', error);
      }
    }
    
    if (status === 'authenticated') {
      loadClasses();
    }
  }, [status]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim() || !mensagem.trim()) {
      setError('Título e mensagem são obrigatórios');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const payload: Record<string, any> = {
        titulo,
        mensagem,
      };
      
      // Adicionar URL se especificada
      if (url.trim()) {
        payload.url = url;
      }
      
      // Adicionar filtros conforme o tipo de notificação
      if (tipoNotificacao === 'classe' && classeId) {
        payload.classeId = classeId;
      } else if (tipoNotificacao === 'usuarios' && usuarioIds.length > 0) {
        payload.usuarioIds = usuarioIds;
      }
      
      const response = await fetch('/api/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao enviar notificações');
      }
      
      setResult(data);
    } catch (err) {
      console.error('Erro ao enviar notificações push:', err);
      setError(err instanceof Error ? err.message : 'Erro ao enviar notificações');
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jd-primary"></div>
      </div>
    );
  }
  
  if (status === 'unauthenticated' || !session) {
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-jd-primary mb-6">Enviar Notificações Push</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
              Título *
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
              placeholder="Título da notificação"
              required
            />
          </div>
          
          <div>
            <label htmlFor="mensagem" className="block text-sm font-medium text-gray-700">
              Mensagem *
            </label>
            <textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
              placeholder="Conteúdo da notificação"
              required
            />
          </div>
          
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">
              URL (opcional)
            </label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
              placeholder="URL para onde o usuário será redirecionado ao clicar na notificação"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destinatários
            </label>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="todos"
                  type="radio"
                  name="tipoNotificacao"
                  value="todos"
                  checked={tipoNotificacao === 'todos'}
                  onChange={() => setTipoNotificacao('todos')}
                  className="h-4 w-4 text-jd-primary focus:ring-jd-primary"
                />
                <label htmlFor="todos" className="ml-2 block text-sm text-gray-700">
                  Todos os usuários
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="classe"
                  type="radio"
                  name="tipoNotificacao"
                  value="classe"
                  checked={tipoNotificacao === 'classe'}
                  onChange={() => setTipoNotificacao('classe')}
                  className="h-4 w-4 text-jd-primary focus:ring-jd-primary"
                />
                <label htmlFor="classe" className="ml-2 block text-sm text-gray-700">
                  Usuários de uma classe específica
                </label>
              </div>
              
              {tipoNotificacao === 'classe' && (
                <div className="ml-6 mt-2">
                  <select
                    value={classeId || ''}
                    onChange={(e) => setClasseId(e.target.value ? Number(e.target.value) : undefined)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
                  >
                    <option value="">Selecione uma classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  id="usuarios"
                  type="radio"
                  name="tipoNotificacao"
                  value="usuarios"
                  checked={tipoNotificacao === 'usuarios'}
                  onChange={() => setTipoNotificacao('usuarios')}
                  className="h-4 w-4 text-jd-primary focus:ring-jd-primary"
                />
                <label htmlFor="usuarios" className="ml-2 block text-sm text-gray-700">
                  Usuários específicos (IDs separados por vírgula)
                </label>
              </div>
              
              {tipoNotificacao === 'usuarios' && (
                <div className="ml-6 mt-2">
                  <input
                    type="text"
                    placeholder="ids separados por vírgula, ex: id1,id2,id3"
                    value={usuarioIds.join(',')}
                    onChange={(e) => setUsuarioIds(e.target.value.split(',').map(id => id.trim()).filter(Boolean))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
                  />
                </div>
              )}
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {result && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              <h3 className="font-bold mb-1">Notificações enviadas com sucesso</h3>
              <p>Total de inscrições: {result.totalSubscriptions}</p>
              <p>Enviadas com sucesso: {result.successCount}</p>
              {result.errorCount > 0 && (
                <p>Falhas no envio: {result.errorCount}</p>
              )}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-jd-primary text-white rounded hover:bg-jd-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar Notificações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 