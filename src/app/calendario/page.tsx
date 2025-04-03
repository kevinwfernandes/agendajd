"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Calendar } from '@/components/Calendar';
import { EventModal } from '@/components/EventModal';
import { TipoUsuario } from '@prisma/client';

interface Event {
  id: number;
  titulo: string;
  descricao: string;
  data: Date;
  publico: boolean;
  sincGCalendar: boolean;
  classeId?: number;
  autorId: string;
}

export default function CalendarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
      const response = await fetch('/api/eventos');
      const data = await response.json();
      
      // Convertendo strings de data para objetos Date
      const eventsWithDates = data.map((event: any) => ({
        ...event,
        data: new Date(event.data)
      }));
      
      setEvents(eventsWithDates);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    if (isAdmin) {
      setSelectedDate(date);
      setShowModal(true);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  const handleEventSaved = () => {
    handleCloseModal();
    fetchEvents();
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
      
      {loading ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jd-primary"></div>
        </div>
      ) : (
        <>
          <Calendar events={events} onDateClick={handleDateClick} />
          
          {isAdmin && (
            <div className="mt-4">
              <button 
                onClick={() => setShowModal(true)}
                className="bg-jd-primary text-white px-4 py-2 rounded-md hover:bg-jd-primary-dark transition-colors"
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
              selectedDate={selectedDate}
            />
          )}
        </>
      )}
    </div>
  );
} 