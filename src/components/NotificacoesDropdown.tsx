"use client";

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BellIcon } from '@heroicons/react/24/outline';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  data: string | Date;
  lida: boolean;
  usuarioId: string;
  eventoId?: number | null;
  recadoId?: number | null;
  evento?: {
    id: number;
    titulo: string;
    data: string | Date;
  } | null;
  recado?: {
    id: number;
    texto: string;
    data: string | Date;
  } | null;
}

export function NotificacoesDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [naoLidas, setNaoLidas] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Carregar notificações
  const carregarNotificacoes = async () => {
    if (!session) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/notificacoes');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setNotificacoes(data);
        setNaoLidas(data.filter(notif => !notif.lida).length);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  // Marcar notificação como lida
  const marcarComoLida = async (id: number) => {
    try {
      await fetch('/api/notificacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });
      
      // Atualizar estado local
      setNotificacoes(prevNotifs => 
        prevNotifs.map(notif => 
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );
      
      setNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carregar notificações quando o componente montar ou sessão mudar
  useEffect(() => {
    if (session) {
      carregarNotificacoes();
    }
  }, [session]);

  // Verificar por novas notificações periodicamente
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(() => {
      carregarNotificacoes();
    }, 60000); // A cada minuto
    
    return () => clearInterval(interval);
  }, [session]);

  // Formatar data para exibição
  const formatarData = (data: string | Date) => {
    const date = typeof data === 'string' ? new Date(data) : data;
    return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  // Obter URL para redirecionamento com base no tipo da notificação
  const getNotificacaoUrl = (notificacao: Notificacao) => {
    if (notificacao.eventoId) {
      return `/calendario?evento=${notificacao.eventoId}`;
    } else if (notificacao.recadoId) {
      return `/recados/${notificacao.recadoId}`;
    }
    return '#';
  };

  // Se não houver sessão, não exibir nada
  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 text-gray-600 hover:text-jd-primary focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="h-6 w-6" />
        {naoLidas > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {naoLidas}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Notificações</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jd-primary mx-auto"></div>
                <p className="mt-2">Carregando notificações...</p>
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500">
                <p>Você não tem notificações</p>
              </div>
            ) : (
              <ul>
                {notificacoes.map((notificacao) => (
                  <li 
                    key={notificacao.id} 
                    className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${!notificacao.lida ? 'bg-blue-50' : ''}`}
                  >
                    <Link 
                      href={getNotificacaoUrl(notificacao)}
                      onClick={() => !notificacao.lida && marcarComoLida(notificacao.id)}
                      className="block px-4 py-3"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notificacao.titulo}
                        </p>
                        {!notificacao.lida && (
                          <span className="ml-2 min-w-max px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Nova
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notificacao.mensagem}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatarData(notificacao.data)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-sm text-jd-primary hover:text-jd-primary-dark font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 