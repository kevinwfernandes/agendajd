"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { EventModal } from '@/components/EventModal';
import { TipoUsuario } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: number;
  titulo: string;
  descricao: string;
  data: Date;
  publico: boolean;
  sincGCalendar: boolean;
  classeId?: number;
  classe?: { id: number; nome: string };
  autorId: string;
  autor?: { id: string; name?: string; email?: string };
}

export default function CalendarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Verificar se o usuário é administrador
  useEffect(() => {
    if (session?.user?.tipoUsuario) {
      const userType = session.user.tipoUsuario as TipoUsuario;
      setIsAdmin(
        userType === 'MACOM_ADMIN_GERAL' || 
        userType === 'ADMIN_DM' || 
        userType === 'ADMIN_FDJ' || 
        userType === 'ADMIN_FRATERNA'
      );
    }
  }, [session]);

  // Carregar eventos
  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/eventos');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar eventos');
      }
      
      const data = await response.json();
      
      // Convertendo strings de data para objetos Date
      const eventsWithDates = data.map((eventData: unknown) => {
        const event = eventData as Event;
        return {
          ...event,
          data: new Date(event.data)
        };
      });
      
      setEvents(eventsWithDates);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError('Não foi possível carregar os eventos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    if (isAdmin) {
      setSelectedDate(date);
      setEventToEdit(null);
      setShowModal(true);
    }
  };

  const handleEventClick = (event: Event) => {
    // Verificar se o usuário é admin ou autor do evento
    const canEdit = isAdmin || (session?.user?.id === event.autorId);
    
    if (canEdit) {
      // Se for admin ou autor, abrir modal de edição
      setEventToEdit(event);
      setSelectedDate(new Date(event.data));
      setShowModal(true);
    } else {
      // Se não for admin nem autor, mostrar detalhes em um modal mais amigável
      showEventDetailsModal(event);
    }
  };

  const showEventDetailsModal = (event: Event) => {
    // Formatar a data do evento
    const eventDate = new Date(event.data);
    const formattedDate = format(eventDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
    
    // Montar detalhes do evento
    const autor = event.autor?.name || 'Não especificado';
    const classe = event.classe?.nome || 'Nenhuma';
    const publicoStr = event.publico ? 'Sim' : 'Não';
    
    // Construir mensagem HTML
    const message = `
      <div style="text-align: left;">
        <h3 style="font-size: 1.2em; margin-bottom: 0.5em; color: #2563eb;">${event.titulo}</h3>
        <p style="margin-bottom: 1em; white-space: pre-wrap;">${event.descricao || 'Sem descrição'}</p>
        <hr style="margin: 1em 0; border: none; border-top: 1px solid #e5e7eb;">
        <p><strong>Data:</strong> ${formattedDate}</p>
        <p><strong>Classe:</strong> ${classe}</p>
        <p><strong>Público:</strong> ${publicoStr}</p>
        <p><strong>Criado por:</strong> ${autor}</p>
      </div>
    `;
    
    // Mostrar detalhes em um alert customizado
    const detailsWindow = window.open('', '_blank', 'width=400,height=400');
    if (detailsWindow) {
      detailsWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Detalhes do Evento</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              button { 
                padding: 8px 16px; 
                background-color: #2563eb; 
                color: white; 
                border: none; 
                border-radius: 4px; 
                cursor: pointer;
                margin-top: 15px;
              }
              button:hover { background-color: #1d4ed8; }
            </style>
          </head>
          <body>
            ${message}
            <button onclick="window.close()">Fechar</button>
          </body>
        </html>
      `);
      detailsWindow.document.close();
    } else {
      // Fallback para alert padrão se o popup for bloqueado
      alert(`${event.titulo}\n\n${event.descricao || 'Sem descrição'}\n\nData: ${formattedDate}\nClasse: ${classe}\nPúblico: ${publicoStr}\nCriado por: ${autor}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setEventToEdit(null);
  };

  const handleEventSaved = () => {
    handleCloseModal();
    fetchEvents();
  };
  
  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }
    
    try {
      setDeleteLoading(true);
      setError(null);
      
      const response = await fetch(`/api/eventos/${eventId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir evento');
      }
      
      // Atualizar lista de eventos após excluir
      setEvents(events.filter(event => event.id !== eventId));
      
      // Se estava editando este evento, fechar o modal
      if (eventToEdit?.id === eventId) {
        handleCloseModal();
      }
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento');
    } finally {
      setDeleteLoading(false);
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-jd-primary mb-6">Calendário de Eventos</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jd-primary"></div>
        </div>
      ) : (
        <>
          <Calendar 
            events={events} 
            onDateClick={handleDateClick} 
            onEventClick={handleEventClick}
          />
          
          {isAdmin && (
            <div className="mt-4">
              <button 
                onClick={() => {
                  setSelectedDate(new Date());
                  setEventToEdit(null);
                  setShowModal(true);
                }}
                className="bg-jd-primary text-white px-4 py-2 rounded-md hover:bg-jd-primary-dark transition-colors"
                disabled={deleteLoading}
              >
                Adicionar Evento
              </button>
            </div>
          )}
          
          {showModal && (
            <EventModal 
              isOpen={showModal} 
              onClose={handleCloseModal} 
              onSave={handleEventSaved}
              onDelete={eventToEdit ? () => handleDeleteEvent(eventToEdit.id) : undefined}
              selectedDate={selectedDate}
              eventToEdit={eventToEdit || undefined}
              deleteLoading={deleteLoading}
            />
          )}
        </>
      )}
    </div>
  );
} 