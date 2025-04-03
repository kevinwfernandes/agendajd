import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions, isUserAdmin } from '@/lib/auth';
import { notifyUsersAboutRecado } from '@/lib/notifications';

const prisma = new PrismaClient();

// GET /api/recados - Listar recados acessíveis ao usuário
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    // Obter parâmetros de query
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Verificar tipo de usuário e filtrar recados de acordo
    const isAdmin = isUserAdmin(session.user.tipoUsuario);
    const userClasseId = session.user.classeId as number | null;
    
    // Filtrar recados:
    // - Se for admin, ver todos os recados
    // - Se não for admin, ver recados globais e da sua classe
    const where = isAdmin 
      ? {} 
      : {
          OR: [
            { global: true },
            { classeId: userClasseId }
          ]
        };
    
    // Buscar recados
    const [recados, total] = await Promise.all([
      prisma.recado.findMany({
        where,
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
      }),
      prisma.recado.count({ where })
    ]);
    
    // Formatar resposta para incluir contagem de comentários
    const recadosFormatados = recados.map(recado => {
      const { _count, ...recadoData } = recado;
      return {
        ...recadoData,
        comentariosCount: _count.comentarios
      };
    });
    
    return NextResponse.json({
      recados: recadosFormatados,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Erro ao listar recados:', error);
    return NextResponse.json(
      { message: 'Erro ao listar recados' },
      { status: 500 }
    );
  }
}

// POST /api/recados - Criar novo recado
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    // Obter dados do corpo da requisição
    const { texto, global, classeId } = await request.json();
    
    if (!texto || texto.trim() === '') {
      return NextResponse.json(
        { message: 'O texto do recado é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar permissões para definir recado global ou com classe específica
    const userClasseId = session.user.classeId as number | null;
    const isAdmin = isUserAdmin(session.user.tipoUsuario);
    
    // Apenas admins podem criar recados globais ou para outras classes
    if (!isAdmin && (global || (classeId !== undefined && classeId !== userClasseId))) {
      return NextResponse.json(
        { message: 'Não autorizado a criar recados globais ou para outras classes' },
        { status: 403 }
      );
    }
    
    // Criar recado
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
    
    // Enviar notificações sobre o novo recado
    try {
      await notifyUsersAboutRecado(recado);
    } catch (err) {
      console.error('Erro ao enviar notificações:', err);
      // Continuar mesmo com erro nas notificações
    }
    
    return NextResponse.json(recado, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar recado:', error);
    return NextResponse.json(
      { message: 'Erro ao criar o recado' },
      { status: 500 }
    );
  }
} 