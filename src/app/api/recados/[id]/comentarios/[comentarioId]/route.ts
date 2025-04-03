import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// DELETE /api/recados/[id]/comentarios/[comentarioId] - Excluir um comentário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string, comentarioId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    const recadoId = parseInt(params.id);
    const comentarioId = parseInt(params.comentarioId);
    
    if (isNaN(recadoId) || isNaN(comentarioId)) {
      return NextResponse.json({ message: 'IDs inválidos' }, { status: 400 });
    }
    
    // Buscar o comentário para verificar permissões
    const comentario = await prisma.comentarioRecado.findUnique({
      where: { id: comentarioId },
      include: {
        recado: {
          select: {
            id: true,
            autorId: true
          }
        }
      }
    });
    
    if (!comentario) {
      return NextResponse.json({ message: 'Comentário não encontrado' }, { status: 404 });
    }
    
    // Verificar se o comentário pertence ao recado especificado
    if (comentario.recadoId !== recadoId) {
      return NextResponse.json({ message: 'Comentário não pertence ao recado especificado' }, { status: 400 });
    }
    
    // Verificar permissões:
    // - O autor do comentário pode excluir seu próprio comentário
    // - O autor do recado pode excluir qualquer comentário no seu recado
    // - Administradores podem excluir qualquer comentário
    const userTipo = session.user.tipoUsuario as string;
    const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(userTipo);
    const isComentarioAutor = comentario.autorId === session.user.id;
    const isRecadoAutor = comentario.recado.autorId === session.user.id;
    
    if (!isAdmin && !isComentarioAutor && !isRecadoAutor) {
      return NextResponse.json({ 
        message: 'Você não tem permissão para excluir este comentário' 
      }, { status: 403 });
    }
    
    // Excluir o comentário
    await prisma.comentarioRecado.delete({
      where: { id: comentarioId }
    });
    
    return NextResponse.json({ message: 'Comentário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir comentário:', error);
    return NextResponse.json(
      { message: 'Erro ao excluir comentário' },
      { status: 500 }
    );
  }
} 