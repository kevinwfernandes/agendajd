"use client";

import { useState } from 'react';
import { EventModal } from '@/components/EventModal';

export default function TesteEventosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const selectedDate = new Date();

  const handleSave = () => {
    setIsModalOpen(false);
    alert('Evento salvo com sucesso!');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Teste do Modal de Eventos</h1>
      
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-jd-primary text-white rounded hover:bg-jd-primary-dark"
      >
        Abrir Modal de Novo Evento
      </button>
      
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        selectedDate={selectedDate}
      />
    </div>
  );
} 