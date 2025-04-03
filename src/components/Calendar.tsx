"use client";

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface Event {
  id: number;
  titulo: string;
  descricao: string;
  data: Date;
  publico: boolean;
  classeId?: number;
}

interface CalendarProps {
  events: Event[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: Event) => void;
}

export function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  useEffect(() => {
    // Gerar todos os dias do mês atual
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  }, [currentMonth]);
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    setSelectedEventId(null);
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    setSelectedEventId(null);
  };
  
  // Filtrar eventos para o dia específico
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.data), day));
  };

  // Manipular clique no evento
  const handleEventClick = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation(); // Evitar propagação para o onClick do dia
    setSelectedEventId(event.id);
    onEventClick(event);
  };
  
  // Formatar a hora para exibição
  const formatEventTime = (date: Date) => {
    return format(date, 'HH:mm');
  };
  
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-jd-primary text-white">
        <h2 className="text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-jd-primary-dark text-white"
            aria-label="Mês anterior"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-jd-primary-dark text-white"
            aria-label="Próximo mês"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-jd-primary-light p-2 text-center text-sm font-medium text-white">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Dias do mês anterior para preencher a primeira semana */}
        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, index) => (
          <div key={`prev-${index}`} className="bg-white p-2 h-16 md:h-32">
            <span className="text-gray-300"></span>
          </div>
        ))}
        
        {/* Dias do mês atual */}
        {calendarDays.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={day.toString()} 
              onClick={() => onDateClick(day)}
              className={`bg-white p-2 h-16 md:h-32 relative overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors ${
                isCurrentDay ? 'border-l-4 border-jd-primary' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`text-sm font-semibold ${
                  isCurrentDay ? 'text-jd-primary' : 'text-gray-700'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="mt-1 space-y-1 max-h-[75%] overflow-y-auto">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => handleEventClick(e, event)}
                    className={`px-1.5 py-0.5 text-xs md:text-sm rounded truncate flex items-center transition-all ${
                      event.id === selectedEventId 
                        ? 'ring-2 ring-offset-1 ring-jd-accent shadow-md transform scale-105 z-10 border-2 border-jd-accent'
                        : ''
                    } ${
                      event.publico 
                        ? 'bg-jd-primary text-white hover:bg-jd-primary-light'
                        : 'bg-jd-secondary-light text-jd-primary hover:bg-jd-secondary'
                    }`}
                    title={`${event.titulo} - Clique para ver detalhes`}
                  >
                    <span className="inline-block w-8 md:w-10 font-medium">
                      {formatEventTime(new Date(event.data))}
                    </span>
                    <span className="truncate">
                      {event.titulo}
                    </span>
                  </div>
                ))}
              </div>
              
              {dayEvents.length > 1 && (
                <div className="absolute bottom-1 right-1 text-xs text-white bg-jd-primary px-1.5 py-0.5 rounded-full">
                  {dayEvents.length}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Dias do próximo mês para completar a última semana */}
        {Array.from({ length: 6 - new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDay() }).map((_, index) => (
          <div key={`next-${index}`} className="bg-white p-2 h-16 md:h-32">
            <span className="text-gray-300"></span>
          </div>
        ))}
      </div>
    </div>
  );
} 