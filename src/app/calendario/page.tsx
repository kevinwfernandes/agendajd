"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { EventModal } from '@/components/EventModal';
import { TipoUsuario } from '@prisma/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Navbar from '@/components/Navbar';

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
    
    // Construir mensagem HTML para o modal de detalhes do evento
    const message = `
      <div style="text-align: left;">
        <h3 style="font-size: 1.5em; margin-bottom: 0.8em; color: #0F2B5B; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">${event.titulo}</h3>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 1.5em; white-space: pre-wrap;">
          ${event.descricao || 'Sem descrição disponível'}
        </div>
        
        <div style="display: grid; grid-template-columns: 120px 1fr; row-gap: 12px;">
          <div style="font-weight: bold; color: #0F2B5B;">Data:</div>
          <div>${formattedDate}</div>
          
          <div style="font-weight: bold; color: #0F2B5B;">Classe:</div>
          <div>${classe}</div>
          
          <div style="font-weight: bold; color: #0F2B5B;">Público:</div>
          <div>${publicoStr}</div>
          
          <div style="font-weight: bold; color: #0F2B5B;">Criado por:</div>
          <div>${autor}</div>
        </div>
      </div>
    `;
    
    // Mostrar detalhes em um alert customizado ou em um modal
    try {
      // Tentar abrir uma nova janela com os detalhes formatados
      const detailsWindow = window.open('', '_blank', 'width=450,height=550,toolbar=0,menubar=0');
      if (detailsWindow) {
        detailsWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Detalhes do Evento: ${event.titulo}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  padding: 20px; 
                  margin: 0;
                  line-height: 1.5;
                }
                h1, h2, h3 { margin-top: 0; }
                button { 
                  padding: 10px 20px; 
                  background-color: #0F2B5B; 
                  color: white; 
                  border: none; 
                  border-radius: 4px; 
                  cursor: pointer;
                  margin-top: 20px;
                  font-size: 1em;
                  width: 100%;
                }
                button:hover { background-color: #0A1A33; }
                @media (max-width: 600px) {
                  body { padding: 15px; }
                }
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
        // Falback para modal interno se o popup for bloqueado
        showInPageModal(event, formattedDate, autor, classe, publicoStr);
      }
    } catch (error) {
      // Falback para alert padrão em caso de erro
      alert(`${event.titulo}\n\n${event.descricao || 'Sem descrição'}\n\nData: ${formattedDate}\nClasse: ${classe}\nPúblico: ${publicoStr}\nCriado por: ${autor}`);
    }
  };

  // Exibir um modal na própria página se o popup for bloqueado
  const showInPageModal = (
    event: Event, 
    formattedDate: string, 
    autor: string, 
    classe: string, 
    publicoStr: string
  ) => {
    // Criar elemento div para o modal
    const modalOverlay = document.createElement('div');
    modalOverlay.style.position = 'fixed';
    modalOverlay.style.top = '0';
    modalOverlay.style.left = '0';
    modalOverlay.style.width = '100%';
    modalOverlay.style.height = '100%';
    modalOverlay.style.backgroundColor = 'rgba(0,0,0,0.7)';
    modalOverlay.style.display = 'flex';
    modalOverlay.style.justifyContent = 'center';
    modalOverlay.style.alignItems = 'center';
    modalOverlay.style.zIndex = '9999';
    
    // Criar conteúdo do modal
    const modalContent = document.createElement('div');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.padding = '20px';
    modalContent.style.borderRadius = '8px';
    modalContent.style.maxWidth = '90%';
    modalContent.style.width = '450px';
    modalContent.style.maxHeight = '80vh';
    modalContent.style.overflowY = 'auto';
    
    // Adicionar HTML do evento
    modalContent.innerHTML = `
      <div style="text-align: left;">
        <h3 style="font-size: 1.5em; margin-bottom: 0.8em; color: #0F2B5B; border-bottom: 2px solid #D4AF37; padding-bottom: 8px;">${event.titulo}</h3>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 1.5em; white-space: pre-wrap;">
          ${event.descricao || 'Sem descrição disponível'}
        </div>
        
        <div style="display: grid; grid-template-columns: 120px 1fr; row-gap: 12px;">
          <div style="font-weight: bold; color: #0F2B5B;">Data:</div>
          <div>${formattedDate}</div>
          
          <div style="font-weight: bold; color: #0F2B5B;">Classe:</div>
          <div>${classe}</div>
          
          <div style="font-weight: bold; color: #0F2B5B;">Público:</div>
          <div>${publicoStr}</div>
          
          <div style="font-weight: bold; color: #0F2B5B;">Criado por:</div>
          <div>${autor}</div>
        </div>
        
        <button style="padding: 10px 20px; background-color: #0F2B5B; color: white; border: none; border-radius: 4px; cursor: pointer; margin-top: 20px; font-size: 1em; width: 100%;" id="close-event-modal">Fechar</button>
      </div>
    `;
    
    // Adicionar o modal ao corpo da página
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Adicionar evento de clique para fechar o modal
    const closeButton = document.getElementById('close-event-modal');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modalOverlay);
      });
    }
    
    // Fechar o modal ao clicar fora dele
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        document.body.removeChild(modalOverlay);
      }
    });
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
    <div className="container mx-auto p-4 bg-jd-light min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 py-6">
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
      
      <footer className="bg-jd-dark text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-between items-center flex-wrap">
            <div className="text-center md:text-left">
              <h3 className="text-jd-accent text-xl font-bold">AgendaJD</h3>
              <p className="text-jd-secondary-dark">
                Calendário de Eventos
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