import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions, isUserAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar permissões
    const currentUserTipo = session.user.tipoUsuario;
    const isAdmin = isUserAdmin(currentUserTipo);
    const isSelf = session.user.id === userId;
    
    if (!isAdmin && !isSelf) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
    
    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        tipoUsuario: true,
        classeId: true,
        createdAt: true,
        classe: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    );
  }
} 