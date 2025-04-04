import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions, isUserAdmin } from '@/lib/auth';

// Usar uma nova instância do prisma para testes mais isolados
const prisma = new PrismaClient();

/**
 * Endpoint de diagnóstico para criação de recados
 * Esta é uma versão de debug da API de recados original que inclui mais logs
 * e verificações para ajudar a diagnosticar problemas em produção
 */

interface LogEntry {
  timestamp: string;
  evento: string;
  [key: string]: unknown;
}

// POST /api/recados-debug - Criar novo recado com logs avançados
export async function POST(request: NextRequest) {
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
    const session = await getServerSession(authOptions);
    
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
    
    // Obter e validar dados do corpo da requisição
    let bodyText: string;
    try {
      bodyText = await request.text();
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Corpo da requisição obtido",
        tamanho: bodyText.length,
        corpo: bodyText.substring(0, 200) + (bodyText.length > 200 ? '...' : '')
      });
    } catch (bodyError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao ler corpo da requisição",
        erro: bodyError instanceof Error ? bodyError.message : "Erro desconhecido"
      });
      return NextResponse.json({
        success: false,
        message: 'Erro ao ler corpo da requisição',
        logs
      }, { status: 400 });
    }
    
    let bodyData;
    try {
      bodyData = JSON.parse(bodyText);
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Corpo da requisição parseado com sucesso",
        dados: bodyData
      });
    } catch (parseError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao parsear JSON do corpo da requisição",
        erro: parseError instanceof Error ? parseError.message : "Erro desconhecido",
        corpo: bodyText
      });
      return NextResponse.json({
        success: false,
        message: 'Corpo da requisição não é um JSON válido',
        logs
      }, { status: 400 });
    }
    
    const { texto, global, classeId } = bodyData;
    
    if (!texto || texto.trim() === '') {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Validação de dados falhou: texto vazio"
      });
      return NextResponse.json({
        success: false,
        message: 'O texto do recado é obrigatório',
        logs
      }, { status: 400 });
    }
    
    // Verificar permissões
    const userClasseId = session.user.classeId as number | null;
    const isAdmin = isUserAdmin(session.user.tipoUsuario);
    
    logs.push({
      timestamp: new Date().toISOString(),
      evento: "Verificação de permissões",
      userClasseId,
      isAdmin,
      global,
      classeId
    });
    
    // Apenas admins podem criar recados globais ou para outras classes
    if (!isAdmin && (global || (classeId !== undefined && classeId !== userClasseId))) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Permissão negada: usuário comum tentando criar recado global ou para outra classe"
      });
      return NextResponse.json({
        success: false,
        message: 'Não autorizado a criar recados globais ou para outras classes',
        logs
      }, { status: 403 });
    }
    
    // Criar recado
    try {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Iniciando criação do recado no banco",
        dadosRecado: {
          texto,
          global: global || false,
          classeId: classeId !== undefined ? classeId : userClasseId,
          autorId: session.user.id
        }
      });
      
      const recado = await prisma.recado.create({
        data: {
          texto,
          global: global || false,
          classeId: classeId !== undefined ? classeId : userClasseId,
          autorId: session.user.id
        },
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
          }
        }
      });
      
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Recado criado com sucesso",
        recadoId: recado.id,
        dataRecado: recado.data,
        duracao: Date.now() - startTime
      });
      
      // Verificar se o recado foi realmente persistido
      try {
        const verificacao = await prisma.recado.findUnique({
          where: { id: recado.id }
        });
        
        logs.push({
          timestamp: new Date().toISOString(),
          evento: "Verificação de persistência do recado",
          encontrado: !!verificacao,
          dados: verificacao ? {
            id: verificacao.id,
            texto: verificacao.texto,
            data: verificacao.data,
            global: verificacao.global
          } : null
        });
      } catch (verificacaoError) {
        logs.push({
          timestamp: new Date().toISOString(),
          evento: "Erro ao verificar persistência do recado",
          erro: verificacaoError instanceof Error ? verificacaoError.message : "Erro desconhecido",
        });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Recado criado com sucesso',
        recado,
        logs
      }, { status: 201 });
    } catch (createError) {
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Erro ao criar recado no banco",
        erro: createError instanceof Error ? createError.message : "Erro desconhecido",
        stack: createError instanceof Error ? createError.stack : undefined
      });
      
      return NextResponse.json({
        success: false,
        message: 'Erro ao criar o recado no banco de dados',
        erro: createError instanceof Error ? createError.message : "Erro desconhecido",
        logs
      }, { status: 500 });
    }
  } catch (error) {
    logs.push({
      timestamp: new Date().toISOString(),
      evento: "Erro geral não tratado",
      erro: error instanceof Error ? error.message : "Erro desconhecido",
      stack: error instanceof Error ? error.stack : undefined
    });
    
    console.error('Erro ao processar requisição de recado-debug:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      logs
    }, { status: 500 });
  } finally {
    // Desconectar do banco
    try {
      await prisma.$disconnect();
      logs.push({
        timestamp: new Date().toISOString(),
        evento: "Desconexão do banco realizada",
        duracaoTotal: Date.now() - startTime
      });
    } catch (e) {
      console.error('Erro ao desconectar do banco:', e);
    }
  }
} 