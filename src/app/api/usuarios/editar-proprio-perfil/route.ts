import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// PATCH /api/usuarios/editar-proprio-perfil - Permitir usuário editar próprio perfil
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    // Obter ID do usuário da sessão atual
    const userId = session.user.id;

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { name, classeId } = body;

    // Verificar se pelo menos um campo para atualização foi fornecido
    if (!name && classeId === undefined) {
      return NextResponse.json(
        { message: 'Nenhum dado fornecido para atualização' }, 
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: Record<string, string | number | null> = {};
    
    if (name) updateData.name = name;
    if (classeId !== undefined) updateData.classeId = classeId;

    // Atualizar usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true,
        classeId: true,
        classe: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    return NextResponse.json(
      { message: 'Ocorreu um erro ao atualizar o perfil' }, 
      { status: 500 }
    );
  }
} 