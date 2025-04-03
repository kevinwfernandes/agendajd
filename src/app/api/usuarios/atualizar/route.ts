import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions, isUserAdmin, ADMIN_TYPES } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertAniversario } from '@/lib/aniversario';

// PATCH /api/usuarios/atualizar - Atualizar dados de um usuário
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { userId, name, email, tipoUsuario, classeId, dataNascimento } = body;

    if (!userId) {
      return NextResponse.json({ message: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Verificar permissões
    const currentUserTipo = session.user.tipoUsuario;
    const isAdmin = isUserAdmin(currentUserTipo);
    
    if (!isAdmin) {
      return NextResponse.json({ message: 'Operação não permitida' }, { status: 403 });
    }

    // Buscar usuário atual para validar operação
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }

    // Validações adicionais baseadas no tipo de admin
    // Apenas MACOM_ADMIN_GERAL pode criar outros admins
    if (
      tipoUsuario && 
      ADMIN_TYPES.includes(tipoUsuario) && 
      currentUserTipo !== 'MACOM_ADMIN_GERAL'
    ) {
      return NextResponse.json(
        { message: 'Apenas o administrador geral pode criar ou modificar administradores' }, 
        { status: 403 }
      );
    }

    // Preparar dados para atualização
    const updateData: Record<string, string | number | null | Date> = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (tipoUsuario) updateData.tipoUsuario = tipoUsuario;
    if (classeId !== undefined) updateData.classeId = classeId;
    if (dataNascimento !== undefined) {
      updateData.dataNascimento = dataNascimento ? new Date(dataNascimento) : null;
    }

    // Atualizar usuário no banco de dados
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true,
        classeId: true,
        dataNascimento: true
      }
    });

    // Atualizar aniversário e evento no calendário, se tiver data de nascimento
    try {
      await upsertAniversario(
        updatedUser.id, 
        updateData.dataNascimento !== undefined 
          ? (updateData.dataNascimento as Date | null)
          : (targetUser.dataNascimento || null)
      );
    } catch (err) {
      console.error('Erro ao atualizar aniversário no calendário:', err);
      // Continuamos mesmo com erro na atualização do aniversário
    }

    return NextResponse.json(updatedUser, { status: 200 });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { message: 'Ocorreu um erro ao atualizar o usuário' }, 
      { status: 500 }
    );
  }
} 