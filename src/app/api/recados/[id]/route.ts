import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, TipoUsuario } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions, isUserAdmin } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/recados/[id] - Obter um recado específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do recado inválido' }, { status: 400 });
    }
    
    // Buscar o recado
    const recado = await prisma.recado.findUnique({
      where: { id },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
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
    
    if (!recado) {
      return NextResponse.json({ message: 'Recado não encontrado' }, { status: 404 });
    }
    
    // Verificar permissões (usuário pode ver recados globais, da sua classe ou se for admin)
    const userTipo = session.user.tipoUsuario as TipoUsuario;
    const isAdmin = isUserAdmin(userTipo);
    const userClasseId = session.user.classeId as number | null;
    
    // Se o recado for global, qualquer usuário pode vê-lo
    // Se não for global, verificar se o usuário é admin ou pertence à classe do recado
    if (!recado.global && !isAdmin && recado.classeId !== userClasseId) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
    
    return NextResponse.json(recado);
  } catch (error) {
    console.error('Erro ao buscar recado:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar o recado' },
      { status: 500 }
    );
  }
}

// PUT /api/recados/[id] - Atualizar um recado
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do recado inválido' }, { status: 400 });
    }
    
    // Buscar o recado existente
    const recadoExistente = await prisma.recado.findUnique({
      where: { id }
    });
    
    if (!recadoExistente) {
      return NextResponse.json({ message: 'Recado não encontrado' }, { status: 404 });
    }
    
    // Verificar permissões (admin ou autor do recado)
    const userTipo = session.user.tipoUsuario as TipoUsuario;
    const isAdmin = isUserAdmin(userTipo);
    const isAutor = recadoExistente.autorId === session.user.id;
    
    if (!isAdmin && !isAutor) {
      return NextResponse.json({ message: 'Sem permissão para editar este recado' }, { status: 403 });
    }
    
    // Obter dados do corpo da requisição
    const body = await request.json();
    const { texto, global, classeId } = body;
    
    // Validar dados
    if (!texto || texto.trim() === '') {
      return NextResponse.json({ message: 'Texto do recado é obrigatório' }, { status: 400 });
    }
    
    // Se não for admin, não pode alterar a classe ou flag global
    const updateData: any = { texto };
    
    if (isAdmin) {
      if (global !== undefined) updateData.global = global;
      if (classeId !== undefined) updateData.classeId = classeId;
    }
    
    // Atualizar recado
    const recadoAtualizado = await prisma.recado.update({
      where: { id },
      data: updateData,
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
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
    
    return NextResponse.json(recadoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar recado:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar o recado' },
      { status: 500 }
    );
  }
}

// DELETE /api/recados/[id] - Excluir um recado
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'ID do recado inválido' }, { status: 400 });
    }
    
    // Buscar o recado para verificar permissões
    const recado = await prisma.recado.findUnique({
      where: { id }
    });
    
    if (!recado) {
      return NextResponse.json({ message: 'Recado não encontrado' }, { status: 404 });
    }
    
    // Verificar permissões (apenas admins ou autor do recado podem excluir)
    const userTipo = session.user.tipoUsuario as string;
    const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(userTipo);
    const isAutor = recado.autorId === session.user.id;
    
    if (!isAdmin && !isAutor) {
      return NextResponse.json({ 
        message: 'Você não tem permissão para excluir este recado' 
      }, { status: 403 });
    }
    
    // Excluir o recado (os comentários serão excluídos automaticamente devido à relação onDelete: Cascade)
    await prisma.recado.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Recado excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir recado:', error);
    return NextResponse.json(
      { message: 'Erro ao excluir recado' },
      { status: 500 }
    );
  }
} 