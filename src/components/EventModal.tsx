"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ClasseSelector from './ClasseSelector';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedDate: Date | null;
  eventToEdit?: {
    id: number;
    titulo: string;
    descricao: string;
    data: Date;
    publico: boolean;
    sincGCalendar: boolean;
    classeId?: number;
  };
}

export function EventModal({ isOpen, onClose, onSave, selectedDate, eventToEdit }: EventModalProps) {
  const { data: session } = useSession();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [data, setData] = useState<string>('');
  const [hora, setHora] = useState('08:00');
  const [publico, setPublico] = useState(false);
  const [sincGCalendar, setSincGCalendar] = useState(false);
  const [classeId, setClasseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inicializar campos com dados do evento a ser editado ou data selecionada
  useEffect(() => {
    if (eventToEdit) {
      setTitulo(eventToEdit.titulo);
      setDescricao(eventToEdit.descricao);
      const eventDate = new Date(eventToEdit.data);
      setData(format(eventDate, 'yyyy-MM-dd'));
      setHora(format(eventDate, 'HH:mm'));
      setPublico(eventToEdit.publico);
      setSincGCalendar(eventToEdit.sincGCalendar);
      setClasseId(eventToEdit.classeId || null);
    } else if (selectedDate) {
      setData(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [eventToEdit, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setError('O título é obrigatório');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Combinar data e hora
      const dataHora = new Date(`${data}T${hora}`);
      
      const eventData = {
        titulo,
        descricao,
        data: dataHora.toISOString(),
        publico,
        sincGCalendar,
        classeId: classeId
      };
      
      // Endpoint e método dependem de ser criação ou edição
      const url = eventToEdit 
        ? `/api/eventos/${eventToEdit.id}`
        : '/api/eventos';
      
      const method = eventToEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar evento');
      }
      
      onSave();
    } catch (err) {
      console.error('Erro ao salvar evento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar evento');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {eventToEdit ? 'Editar Evento' : 'Novo Evento'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="titulo" className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
                required
              />
            </div>

            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="data" className="block text-sm font-medium text-gray-700">
                  Data *
                </label>
                <input
                  type="date"
                  id="data"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
                  required
                />
              </div>

              <div>
                <label htmlFor="hora" className="block text-sm font-medium text-gray-700">
                  Hora *
                </label>
                <input
                  type="time"
                  id="hora"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-jd-primary focus:ring-jd-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="classe" className="block text-sm font-medium text-gray-700">
                Classe
              </label>
              <ClasseSelector 
                value={classeId} 
                onChange={setClasseId} 
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="publico"
                checked={publico}
                onChange={(e) => setPublico(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-jd-primary focus:ring-jd-primary"
              />
              <label htmlFor="publico" className="ml-2 block text-sm text-gray-700">
                Evento público (visível para todos)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="sincGCalendar"
                checked={sincGCalendar}
                onChange={(e) => setSincGCalendar(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-jd-primary focus:ring-jd-primary"
              />
              <label htmlFor="sincGCalendar" className="ml-2 block text-sm text-gray-700">
                Sincronizar com Google Calendar
              </label>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-jd-primary hover:bg-jd-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jd-primary"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 