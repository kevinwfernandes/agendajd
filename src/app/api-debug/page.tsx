"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface ApiTestResult {
  url: string;
  method: string;
  status: number;
  statusText: string;
  body: unknown;
  error?: string;
  requestBody?: unknown;
  headers?: Record<string, string>;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

interface CustomEndpoint {
  name: string;
  url: string;
  method: string;
  body: string;
}

export default function ApiDebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiUrl, setApiUrl] = useState('/api/diagnostico');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('');
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<ApiTestResult | null>(null);
  const [customEndpoints] = useState<CustomEndpoint[]>([
    { name: 'GET Diagnóstico', url: '/api/diagnostico', method: 'GET', body: '' },
    { name: 'GET Recados', url: '/api/recados', method: 'GET', body: '' },
    { name: 'POST Novo Recado', url: '/api/recados', method: 'POST', body: '{\n  "texto": "Recado de teste via API Debug",\n  "global": true\n}' }
  ]);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleApiCall = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      // Adicionar corpo da requisição para métodos não-GET
      if (method !== 'GET' && requestBody.trim()) {
        try {
          options.body = requestBody;
        } catch (e) {
          console.error('Erro ao parsear JSON do corpo da requisição:', e);
          setResults(prev => [{
            url: apiUrl,
            method,
            status: 0,
            statusText: 'Erro',
            body: null,
            error: 'Erro ao parsear JSON do corpo da requisição',
            requestBody: requestBody,
            startTime,
            endTime: Date.now(),
            duration: Date.now() - startTime
          }, ...prev]);
          setLoading(false);
          return;
        }
      }
      
      const response = await fetch(apiUrl, options);
      const endTime = Date.now();
      
      let responseBody: unknown;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseBody = await response.json();
      } else {
        responseBody = await response.text();
      }
      
      const result: ApiTestResult = {
        url: apiUrl,
        method,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        requestBody: requestBody ? JSON.parse(requestBody) : null,
        startTime,
        endTime,
        duration: endTime - startTime
      };
      
      setResults(prev => [result, ...prev]);
      setSelectedResult(result);
    } catch (error) {
      console.error('Erro ao chamar API:', error);
      setResults(prev => [{
        url: apiUrl,
        method,
        status: 0,
        statusText: 'Erro',
        body: null,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        requestBody: requestBody ? JSON.parse(requestBody) : null,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime
      }, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  const selectEndpoint = (endpoint: CustomEndpoint) => {
    setApiUrl(endpoint.url);
    setMethod(endpoint.method);
    setRequestBody(endpoint.body);
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
          <h1 className="text-2xl font-bold text-jd-primary mb-6">API Debug</h1>
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
        <h1 className="text-2xl font-bold text-jd-primary mb-6">API Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Painel de Controle */}
          <div className="bg-white rounded-lg shadow-md p-4 md:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Endpoint Tester</h2>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endpoint
              </label>
              <div className="flex items-center">
                <select 
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-jd-primary"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  className="flex-1 ml-2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-jd-primary"
                  placeholder="/api/..."
                />
              </div>
            </div>
            
            {method !== 'GET' && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Corpo da Requisição (JSON)
                </label>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-jd-primary font-mono text-sm"
                  rows={6}
                  placeholder='{"chave": "valor"}'
                />
              </div>
            )}
            
            <button
              onClick={handleApiCall}
              disabled={loading}
              className={`w-full p-2 bg-jd-primary text-white rounded-md hover:bg-jd-primary-dark transition-colors ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Enviando...' : 'Enviar Requisição'}
            </button>
            
            {/* Endpoints pré-configurados */}
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-700 mb-2">Endpoints Comuns</h3>
              <div className="space-y-2">
                {customEndpoints.map((endpoint, index) => (
                  <button
                    key={index}
                    onClick={() => selectEndpoint(endpoint)}
                    className="w-full p-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors text-left truncate"
                  >
                    <span className="font-mono text-xs">{endpoint.method}</span> {endpoint.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Resultados e Visualização */}
          <div className="md:col-span-2 space-y-4">
            {/* Lista de resultados */}
            <div className="bg-white rounded-lg shadow-md p-4 max-h-[200px] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-2">Histórico de Requisições</h2>
              
              {results.length === 0 ? (
                <p className="text-gray-500 italic">Nenhuma requisição feita ainda.</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => (
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
                            result.status >= 200 && result.status < 300
                              ? 'bg-green-100 text-green-800'
                              : result.status >= 400
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status || 'ERR'}
                          </span>
                          <span className="ml-2 font-mono text-xs">{result.method}</span>
                          <span className="ml-2 text-sm truncate">{result.url}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {result.duration ? `${result.duration}ms` : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Visualização de resultado */}
            {selectedResult && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-2">Detalhes da Resposta</h2>
                
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        selectedResult.status >= 200 && selectedResult.status < 300
                          ? 'bg-green-100 text-green-800'
                          : selectedResult.status >= 400
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedResult.status} {selectedResult.statusText}
                      </span>
                      <span className="ml-2 text-sm">{selectedResult.url}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {selectedResult.duration ? `${selectedResult.duration}ms` : ''}
                    </span>
                  </div>
                  
                  {/* Abas para mostrar resposta, requisição, headers */}
                  <div className="flex border-b border-gray-200 mb-2">
                    <button className="py-1 px-3 text-sm font-medium text-jd-primary border-b-2 border-jd-primary">
                      Resposta
                    </button>
                  </div>
                  
                  {selectedResult.error ? (
                    <div className="bg-red-50 p-3 rounded text-red-700 font-mono text-sm whitespace-pre-wrap">
                      {selectedResult.error}
                    </div>
                  ) : (
                    <pre className="bg-gray-50 p-3 rounded font-mono text-sm overflow-auto max-h-[300px] whitespace-pre-wrap">
                      {formatJson(selectedResult.body)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 