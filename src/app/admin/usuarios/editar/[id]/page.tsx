"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';

type User = {
  id: string;
  name: string;
  email: string;
  tipoUsuario: string;
  classeId?: number | null;
};

type Classe = {
  id: number;
  nome: string;
  descricao?: string;
};

export default function EditarUsuarioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('');
  const [classeId, setClasseId] = useState<number | null>(null);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Verificar permissões e carregar dados do usuário
  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      const userTipo = session?.user?.tipoUsuario;
      const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(userTipo || '');
      
      if (!isAdmin) {
        router.push('/');
        return;
      }

      fetchUserData();
      fetchClasses();
    }
  }, [status, router, userId, session]);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/usuarios/${userId}`);
      if (!response.ok) throw new Error('Falha ao buscar dados do usuário');
      
      const userData = await response.json();
      setUser(userData);
      setNome(userData.name);
      setEmail(userData.email);
      setTipoUsuario(userData.tipoUsuario || '');
      setClasseId(userData.classeId);
    } catch (err) {
      setError('Não foi possível carregar os dados do usuário');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (!response.ok) throw new Error('Falha ao buscar classes');
      
      const classesData = await response.json();
      setClasses(classesData);
    } catch (err) {
      console.error('Erro ao carregar classes:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updateData = {
        name: nome,
        email,
        tipoUsuario,
        classeId: classeId || null
      };

      const response = await fetch(`/api/usuarios/atualizar`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...updateData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar usuário');
      }

      setSuccess('Usuário atualizado com sucesso!');
      setTimeout(() => {
        router.push('/admin/usuarios');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
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
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-jd-primary">
              Editar Usuário
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Modifique os dados do usuário
            </p>
          </div>
          <div className="mt-4 flex md:mt-0">
            <button
              type="button"
              onClick={() => router.push('/admin/usuarios')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Voltar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-jd-primary focus:border-jd-primary sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-jd-primary focus:border-jd-primary sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="tipoUsuario" className="block text-sm font-medium text-gray-700">
                    Tipo de Usuário
                  </label>
                  <select
                    id="tipoUsuario"
                    value={tipoUsuario}
                    onChange={(e) => setTipoUsuario(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-jd-primary focus:border-jd-primary sm:text-sm"
                    required
                  >
                    <option value="" disabled>Selecione um tipo</option>
                    <option value="MACOM">Maçom</option>
                    <option value="MACOM_ADMIN_GERAL">Maçom (Admin Geral)</option>
                    <option value="ADMIN_DM">Admin DeMolay</option>
                    <option value="ADMIN_FDJ">Admin Filhas de Jó</option>
                    <option value="ADMIN_FRATERNA">Admin Fraterna</option>
                    <option value="MEMBRO_DM">Membro DeMolay</option>
                    <option value="MEMBRO_FDJ">Membro Filhas de Jó</option>
                    <option value="MEMBRO_FRATERNA">Membro Fraterna</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="classeId" className="block text-sm font-medium text-gray-700">
                    Classe
                  </label>
                  <select
                    id="classeId"
                    value={classeId || ''}
                    onChange={(e) => setClasseId(e.target.value ? Number(e.target.value) : null)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-jd-primary focus:border-jd-primary sm:text-sm"
                  >
                    <option value="">Nenhuma classe</option>
                    {classes.map((classe) => (
                      <option key={classe.id} value={classe.id}>
                        {classe.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="submit"
                disabled={saving}
                className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                  saving ? 'bg-gray-400' : 'bg-jd-primary hover:bg-jd-primary-dark'
                } focus:outline-none`}
              >
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 