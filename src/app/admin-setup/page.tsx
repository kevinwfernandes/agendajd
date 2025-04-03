"use client";

import { useState } from 'react';

interface AdminResult {
  message: string;
  id?: string;
  email?: string;
  password?: string;
  error?: string;
}

export default function AdminSetup() {
  const [result, setResult] = useState<AdminResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAdmin() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/seed');
      const data = await response.json();
      
      setResult(data);
    } catch (err) {
      setError('Erro ao criar administrador. Verifique o console para mais detalhes.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-jd-secondary-light p-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <h1 className="text-2xl font-bold text-jd-primary mb-6">Configuração Inicial - AgendaJD</h1>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Esta página permite criar o primeiro usuário administrador do sistema 
            (MACOM_ADMIN_GERAL) se ele ainda não existir.
          </p>
          <p className="text-gray-700 mb-4">
            Depois de criado, você poderá fazer login com:
          </p>
          <ul className="list-disc pl-5 mb-4 text-gray-700">
            <li>Email: admin@agendajd.com</li>
            <li>Senha: admin123</li>
          </ul>
          <p className="text-sm text-red-600 mb-4">
            Importante: Após o primeiro login, altere imediatamente a senha do administrador!
          </p>
        </div>

        <button
          onClick={createAdmin}
          disabled={loading}
          className="w-full bg-jd-primary text-white py-2 px-4 rounded-md hover:bg-jd-primary-dark transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Processando...' : 'Criar Administrador'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <h3 className="font-bold mb-2">{result.message}</h3>
            {result.id && (
              <p className="text-sm">
                ID: {result.id}
              </p>
            )}
            {result.email && (
              <p className="text-sm">
                Email: {result.email}
              </p>
            )}
            {result.password && (
              <p className="text-sm">
                Senha: {result.password}
              </p>
            )}
            {result.message && result.message.includes('sucesso') && (
              <div className="mt-3">
                <a 
                  href="/login" 
                  className="text-jd-primary hover:underline"
                >
                  Ir para a página de login
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 