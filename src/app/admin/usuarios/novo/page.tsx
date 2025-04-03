"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function NovoUsuarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('MEMBRO_DM');
  const [classeId, setClasseId] = useState<number | undefined>(undefined);
  const [classes, setClasses] = useState<{ id: number; nome: string }[]>([]);

  // Verificar permissão
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.tipoUsuario) {
      const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(
        session.user.tipoUsuario as string
      );
      
      if (!isAdmin) {
        router.push('/');
      } else {
        fetchClasses();
      }
    }
  }, [session, status, router]);

  // Buscar classes disponíveis
  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/admin/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error('Erro ao buscar classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          tipoUsuario,
          classeId: classeId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao criar usuário');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      // Limpar formulário
      setName('');
      setEmail('');
      setPassword('');
      setTipoUsuario('MEMBRO_DM');
      setClasseId(undefined);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/admin/usuarios');
      }, 2000);
    } catch (error) {
      setError('Ocorreu um erro ao tentar criar o usuário.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex justify-center items-center h-64">
            <p className="text-xl text-jd-primary">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-jd-primary">
              Adicionar Novo Usuário
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Preencha os dados para criar um novo usuário
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => router.push('/admin/usuarios')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Voltar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            Usuário criado com sucesso! Redirecionando...
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-6">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Nome
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="shadow-sm focus:ring-jd-accent focus:border-jd-accent block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="shadow-sm focus:ring-jd-accent focus:border-jd-accent block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="mt-1">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="shadow-sm focus:ring-jd-accent focus:border-jd-accent block w-full sm:text-sm border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="tipoUsuario" className="block text-sm font-medium text-gray-700">
                  Tipo de Usuário
                </label>
                <div className="mt-1">
                  <select
                    id="tipoUsuario"
                    name="tipoUsuario"
                    value={tipoUsuario}
                    onChange={(e) => setTipoUsuario(e.target.value)}
                    className="shadow-sm focus:ring-jd-accent focus:border-jd-accent block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    {/* Apenas admin geral pode criar outros admins */}
                    {session?.user?.tipoUsuario === 'MACOM_ADMIN_GERAL' && (
                      <>
                        <option value="MACOM_ADMIN_GERAL">Maçom (Admin Geral)</option>
                        <option value="ADMIN_DM">Admin DeMolay</option>
                        <option value="ADMIN_FDJ">Admin Filhas de Jó</option>
                        <option value="ADMIN_FRATERNA">Admin Fraterna</option>
                      </>
                    )}
                    <option value="MACOM">Maçom</option>
                    <option value="MEMBRO_DM">Membro DeMolay</option>
                    <option value="MEMBRO_FDJ">Membro Filhas de Jó</option>
                    <option value="MEMBRO_FRATERNA">Membro Fraterna</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="classeId" className="block text-sm font-medium text-gray-700">
                  Classe (opcional)
                </label>
                <div className="mt-1">
                  <select
                    id="classeId"
                    name="classeId"
                    value={classeId || ''}
                    onChange={(e) => setClasseId(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="shadow-sm focus:ring-jd-accent focus:border-jd-accent block w-full sm:text-sm border-gray-300 rounded-md"
                  >
                    <option value="">Selecione uma classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push('/admin/usuarios')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jd-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                    loading ? 'bg-jd-primary-light' : 'bg-jd-primary hover:bg-jd-primary-dark'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jd-accent`}
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 