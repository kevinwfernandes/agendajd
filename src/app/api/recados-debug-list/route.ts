import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Usar uma nova instância do prisma para testes mais isolados
const prisma = new PrismaClient();

interface LogEntry {
  timestamp: string;
  evento: string;
  [key: string]: unknown;
}

/**
 * GET /api/recados-debug-list
 * Versão de debug da rota de listagem de recados com logs detalhados
 */
export async function GET(request: NextRequest) {
  const logs: LogEntry[] = [];
  const startTime = Date.now();
  
  logs.push({
    timestamp: new Date().toISOString(),
    evento: "Requisição iniciada",
    ambiente: process.env.NODE_ENV,
    url: request.url
  });
  
  try {
    // Verificar conexão com o banco
    try {
      await prisma.$connect();
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Conexão com o banco estabelecida com sucesso",
        duracao: Date.now() - startTime
      });
    } catch (dbError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao conectar com o banco de dados",
        erro: dbError instanceof Error ? dbError.message : "Erro desconhecido",
        stack: dbError instanceof Error ? dbError.stack : undefined
      });
      return NextResponse.json({
        success: false,
        message: 'Erro ao conectar com o banco de dados',
        logs
      }, { status: 500 });
    }
    
    // Verificar autenticação
    let session;
    try {
      session = await getServerSession(authOptions);
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "getServerSession chamado com sucesso",
        sessionExiste: !!session,
        userExiste: session && !!session.user
      });
    } catch (sessionError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao chamar getServerSession",
        erro: sessionError instanceof Error ? sessionError.message : "Erro desconhecido",
        stack: sessionError instanceof Error ? sessionError.stack : undefined
      });
      return NextResponse.json({
        success: false,
        message: 'Erro ao verificar autenticação',
        logs
      }, { status: 500 });
    }
    
    if (!session || !session.user) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Autenticação falhou",
        session: session ? "Session existe mas sem user" : "Session não existe"
      });
      return NextResponse.json({
        success: false,
        message: 'Não autenticado',
        logs
      }, { status: 401 });
    }
    
    logs.push({
      timestamp: new Date().toISOString(),
      evento: "Usuário autenticado",
      userId: session.user.id,
      userName: session.user.name,
      userTipo: session.user.tipoUsuario
    });
    
    // Obter parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    logs.push({
      timestamp: new Date().toISOString(),
      evento: "Parâmetros de paginação",
      page,
      limit,
      skip
    });
    
    // Procurar recados
    let recados = [];
    let total = 0;
    
    try {
      // Primeiro tentar contagem
      total = await prisma.recado.count();
      
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Contagem de recados realizada",
        total
      });
      
      // Depois buscar os recados
      recados = await prisma.recado.findMany({
        orderBy: { data: 'desc' },
        skip,
        take: limit,
        include: {
          autor: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              tipoUsuario: true
            }
          },
          classe: {
            select: {
              id: true,
              nome: true
            }
          },
          _count: {
            select: { comentarios: true }
          }
        }
      });
      
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Recados obtidos com sucesso",
        quantidadeRecados: recados.length,
        primeirosIds: recados.slice(0, 3).map(r => r.id)
      });
    } catch (queryError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao consultar recados no banco",
        erro: queryError instanceof Error ? queryError.message : "Erro desconhecido",
        stack: queryError instanceof Error ? queryError.stack : undefined
      });
      return NextResponse.json({
        success: false,
        message: 'Erro ao consultar recados no banco de dados',
        logs
      }, { status: 500 });
    }
    
    // Formatar recados para resposta
    let recadosFormatados = [];
    try {
      recadosFormatados = recados.map(recado => {
        const { _count, ...recadoData } = recado;
        return {
          ...recadoData,
          comentariosCount: _count.comentarios
        };
      });
      
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Recados formatados com sucesso",
        quantidadeFormatados: recadosFormatados.length
      });
    } catch (formatError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao formatar recados",
        erro: formatError instanceof Error ? formatError.message : "Erro desconhecido",
        stack: formatError instanceof Error ? formatError.stack : undefined,
        recadosObtidos: recados.length
      });
      return NextResponse.json({
        success: false,
        message: 'Erro ao processar dados dos recados',
        logs
      }, { status: 500 });
    }
    
    // Retornar resposta
    const response = {
      success: true,
      recados: recadosFormatados,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs
    };
    
    logs.push({
      timestamp: new Date().toISOString(),
      evento: "Resposta preparada com sucesso",
      duracao: Date.now() - startTime
    });
    
    return NextResponse.json(response);
  } catch (error) {
    logs.push({
      timestamp: new Date().toISOString(),
      evento: "Erro não tratado",
      erro: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined
    });
    
    console.error('Erro ao listar recados (debug):', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao processar requisição',
      logs
    }, { status: 500 });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("Erro ao desconectar do prisma:", e);
    }
  }
} 