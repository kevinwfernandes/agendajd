"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface RecadoDiagnostico {
  id: number;
  texto: string;
  data: string;
  global: boolean;
  autor?: {
    id: string;
    name?: string;
    email?: string;
  };
}

interface TestResult {
  endpoint: string;
  status: number;
  statusText: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

export default function RecadosDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [novoRecadoTexto, setNovoRecadoTexto] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultados, setResultados] = useState<TestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [ultimosRecados, setUltimosRecados] = useState<RecadoDiagnostico[]>([]);
  const [carregandoRecados, setCarregandoRecados] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUltimosRecados();
    }
  }, [status, router]);

  const fetchUltimosRecados = async () => {
    setCarregandoRecados(true);
    try {
      const response = await fetch('/api/diagnostico');
      if (!response.ok) {
        throw new Error('Falha ao carregar diagnóstico');
      }
      const data = await response.json();
      setUltimosRecados(data.ultimosRecados || []);
    } catch (error) {
      console.error('Erro ao carregar recados:', error);
    } finally {
      setCarregandoRecados(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!novoRecadoTexto.trim()) {
      alert('O texto do recado não pode estar vazio.');
      return;
    }
    
    setEnviando(true);
    
    try {
      // Testar o endpoint normal
      const normalResponse = await fetch('/api/recados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: novoRecadoTexto,
          global: isGlobal
        }),
      });
      
      const normalResult: TestResult = {
        endpoint: '/api/recados',
        status: normalResponse.status,
        statusText: normalResponse.statusText,
        success: normalResponse.ok,
        data: await normalResponse.json(),
        timestamp: new Date().toISOString()
      };
      
      // Testar o endpoint de debug (com logs adicionais)
      const debugResponse = await fetch('/api/recados-debug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: novoRecadoTexto + " [DEBUG]",
          global: isGlobal
        }),
      });
      
      const debugResult: TestResult = {
        endpoint: '/api/recados-debug',
        status: debugResponse.status,
        statusText: debugResponse.statusText,
        success: debugResponse.ok,
        data: await debugResponse.json(),
        timestamp: new Date().toISOString()
      };
      
      setResultados(prev => [debugResult, normalResult, ...prev]);
      setSelectedResult(debugResult);
      
      // Se um dos endpoints teve sucesso, atualizar a lista de recados
      if (normalResponse.ok || debugResponse.ok) {
        setNovoRecadoTexto('');
        await fetchUltimosRecados();
      }
    } catch (error) {
      const errorResult: TestResult = {
        endpoint: 'Error',
        status: 0,
        statusText: 'Erro de rede ou CORS',
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      };
      
      setResultados(prev => [errorResult, ...prev]);
      setSelectedResult(errorResult);
    } finally {
      setEnviando(false);
    }
  };

  const formatJson = (json: unknown) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch {
      return String(json);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-jd-primary"></div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return null;
  }

  const isAdmin = () => {
    if (!session || !session.user) return false;
    
    const adminTypes = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'];
    return adminTypes.includes(session.user.tipoUsuario as string);
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-jd-light flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-jd-primary mb-6">Diagnóstico de Recados</h1>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-red-500">Acesso negado. Esta página é apenas para administradores.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jd-light flex flex-col">
      <Navbar />
      
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-jd-primary mb-6">Diagnóstico de Recados</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-md p-4 md:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Testar Criação de Recado</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Texto do Recado
                </label>
                <textarea
                  value={novoRecadoTexto}
                  onChange={(e) => setNovoRecadoTexto(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-jd-primary"
                  rows={4}
                  placeholder="Digite o texto do recado..."
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={isGlobal}
                    onChange={(e) => setIsGlobal(e.target.checked)}
                    className="h-4 w-4 text-jd-primary focus:ring-jd-primary border-gray-300 rounded"
                  />
                  <span className="ml-2">Recado Global</span>
                </label>
              </div>
              
              <button
                type="submit"
                disabled={enviando}
                className={`w-full p-2 bg-jd-primary text-white rounded-md hover:bg-jd-primary-dark transition-colors ${
                  enviando ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {enviando ? 'Enviando...' : 'Criar Recado (Normal e Debug)'}
              </button>
            </form>
            
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 mb-2">Últimos Recados</h3>
              
              {carregandoRecados ? (
                <div className="py-2 flex justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-jd-primary"></div>
                </div>
              ) : ultimosRecados.length > 0 ? (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {ultimosRecados.map((recado) => (
                    <div
                      key={recado.id}
                      className="p-2 border border-gray-200 rounded-md text-sm"
                    >
                      <p className="font-medium">{recado.autor?.name || 'Usuário'}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(recado.data).toLocaleString()}
                      </p>
                      <p className="mt-1">{recado.texto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">Nenhum recado encontrado.</p>
              )}
              
              <button
                onClick={fetchUltimosRecados}
                className="mt-2 w-full p-1.5 bg-gray-100 text-gray-800 text-sm rounded-md hover:bg-gray-200 transition-colors"
              >
                Atualizar Lista
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-md p-4 max-h-[200px] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-2">Histórico de Testes</h2>
              
              {resultados.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum teste realizado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {resultados.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedResult(result)}
                      className={`p-2 rounded-md cursor-pointer ${
                        selectedResult === result
                          ? 'bg-jd-primary bg-opacity-10 border border-jd-primary'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            result.success
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {result.status} {result.success ? 'OK' : 'ERRO'}
                          </span>
                          <span className="ml-2 text-sm truncate">{result.endpoint}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {selectedResult && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-2">Detalhes do Resultado</h2>
                
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedResult.success
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedResult.status} {selectedResult.statusText}
                      </span>
                      <span className="ml-2 text-sm">{selectedResult.endpoint}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedResult.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded font-mono text-xs overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {formatJson(selectedResult.data || selectedResult.error || selectedResult)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 