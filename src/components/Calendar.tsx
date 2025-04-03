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
}

export function Calendar({ events, onDateClick }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  useEffect(() => {
    // Gerar todos os dias do mês atual
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    setCalendarDays(days);
  }, [currentMonth]);
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  // Filtrar eventos para o dia específico
  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.data), day));
  };
  
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Dias do mês anterior para preencher a primeira semana */}
        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, index) => (
          <div key={`prev-${index}`} className="bg-white p-2 h-28 md:h-32">
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
              className={`bg-white p-2 h-28 md:h-32 relative overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors ${
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
              
              <div className="mt-1 space-y-1 max-h-[80px] overflow-y-auto">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    className={`px-1 py-0.5 text-xs rounded truncate ${
                      event.publico 
                        ? 'bg-jd-primary text-white'
                        : 'bg-jd-secondary-light text-jd-primary'
                    }`}
                    title={event.titulo}
                  >
                    {format(new Date(event.data), 'HH:mm')} {event.titulo}
                  </div>
                ))}
              </div>
              
              {dayEvents.length > 2 && (
                <div className="absolute bottom-1 right-1 text-xs text-gray-500">
                  +{dayEvents.length - 2} mais
                </div>
              )}
            </div>
          );
        })}
        
        {/* Dias do próximo mês para completar a última semana */}
        {Array.from({ length: 6 - new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDay() }).map((_, index) => (
          <div key={`next-${index}`} className="bg-white p-2 h-28 md:h-32">
            <span className="text-gray-300"></span>
          </div>
        ))}
      </div>
    </div>
  );
} 