"use client";

import { useState, useEffect } from 'react';
import ClasseSelector from '@/components/ClasseSelector';

interface Classe {
  id: number;
  nome: string;
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

export default function TesteClassesPage() {
  const [classeId, setClasseId] = useState<number | null>(null);
  const [classesData, setClassesData] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await fetch('/api/admin/classes');
        if (response.ok) {
          const data = await response.json();
          setClassesData(data);
        }
      } catch (error) {
        console.error('Erro ao carregar classes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Teste de Seleção de Classes</h1>
      
      <div className="max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Selecione uma classe:
          </label>
          <ClasseSelector 
            value={classeId} 
            onChange={setClasseId} 
          />
        </div>
        
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p>
            Classe selecionada: <strong>{classeId ? `ID ${classeId}` : 'Nenhuma'}</strong>
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Classes disponíveis (da API):</h2>
          {loading ? (
            <p>Carregando classes...</p>
          ) : (
            <ul className="list-disc pl-5 space-y-2">
              {classesData.map(classe => (
                <li key={classe.id}>
                  <strong>{classe.nome}</strong> (ID: {classe.id})
                  {classe.descricao && <p className="text-sm text-gray-600">{classe.descricao}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
} 