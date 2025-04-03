"use client";

import { useState, useEffect } from 'react';

interface Classe {
  id: number;
  nome: string;
  descricao?: string;
}

interface ClasseSelectorProps {
  value: number | null;
  onChange: (classeId: number | null) => void;
}

export default function ClasseSelector({ value, onChange }: ClasseSelectorProps) {
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/classes');
        if (!response.ok) {
          throw new Error('Falha ao carregar classes');
        }
        const data = await response.json();
        setClasses(data);
      } catch (err) {
        console.error('Erro ao carregar classes:', err);
        setError('Não foi possível carregar as classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue, 10) : null);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <select disabled className="w-full p-2 border border-gray-300 rounded bg-gray-100">
          <option>Carregando classes...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      className="w-full p-2 border border-gray-300 rounded"
    >
      <option value="">Selecione uma classe</option>
      {classes.map((classe) => (
        <option key={classe.id} value={classe.id}>
          {classe.nome}
          {classe.descricao ? ` - ${classe.descricao}` : ''}
        </option>
      ))}
    </select>
  );
} 