import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

// GET /api/recados/[id]/comentarios - Listar comentários de um recado
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
    
    const recadoId = parseInt(params.id);
    if (isNaN(recadoId)) {
      return NextResponse.json({ message: 'ID do recado inválido' }, { status: 400 });
    }
    
    // Verificar se o recado existe e se o usuário tem acesso a ele
    const recado = await prisma.recado.findUnique({
      where: { id: recadoId },
      select: { 
        id: true, 
        global: true, 
        classeId: true 
      }
    });
    
    if (!recado) {
      return NextResponse.json({ message: 'Recado não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão
    if (!recado.global && recado.classeId !== (session.user.classeId as number | null)) {
      const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA', 'MACOM'].includes(
        session.user.tipoUsuario as string
      );
      
      if (!isAdmin) {
        return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
      }
    }
    
    // Buscar comentários usando SQL direto pois o modelo pode estar inconsistente
    const comentarios = await prisma.$queryRaw`
      SELECT 
        cr."id", cr."texto", cr."data", cr."recadoId", cr."autorId",
        u."id" as "autor_id", u."name" as "autor_name", u."email" as "autor_email", 
        u."image" as "autor_image", u."tipoUsuario" as "autor_tipoUsuario"
      FROM "ComentarioRecado" cr
      JOIN users u ON cr."autorId" = u."id"
      WHERE cr."recadoId" = ${recadoId}
      ORDER BY cr."data" ASC
    `;
    
    // Formatar resultados para manter compatibilidade com o formato esperado
    const formattedComentarios = Array.isArray(comentarios) ? comentarios.map((c: any) => ({
      id: c.id,
      texto: c.texto,
      data: c.data,
      recadoId: c.recadoId,
      autorId: c.autorId,
      autor: {
        id: c.autor_id,
        name: c.autor_name,
        email: c.autor_email,
        image: c.autor_image,
        tipoUsuario: c.autor_tipoUsuario
      }
    })) : [];
    
    return NextResponse.json(formattedComentarios);
  } catch (error) {
    console.error('Erro ao listar comentários:', error);
    return NextResponse.json(
      { message: 'Erro ao listar comentários' },
      { status: 500 }
    );
  }
}

// POST /api/recados/[id]/comentarios - Adicionar comentário a um recado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    const recadoId = parseInt(params.id);
    if (isNaN(recadoId)) {
      return NextResponse.json({ message: 'ID do recado inválido' }, { status: 400 });
    }
    
    // Verificar se o recado existe e se o usuário tem acesso a ele
    const recado = await prisma.recado.findUnique({
      where: { id: recadoId },
      select: { 
        id: true, 
        global: true, 
        classeId: true,
        autorId: true
      }
    });
    
    if (!recado) {
      return NextResponse.json({ message: 'Recado não encontrado' }, { status: 404 });
    }
    
    // Verificar permissão para comentar
    if (!recado.global && recado.classeId !== (session.user.classeId as number | null)) {
      const isAdmin = ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA', 'MACOM'].includes(
        session.user.tipoUsuario as string
      );
      
      if (!isAdmin) {
        return NextResponse.json({ message: 'Acesso negado para comentar neste recado' }, { status: 403 });
      }
    }
    
    // Obter texto do comentário
    const { texto } = await request.json();
    
    if (!texto || texto.trim() === '') {
      return NextResponse.json({ message: 'O texto do comentário é obrigatório' }, { status: 400 });
    }
    
    // Criar comentário usando SQL direto
    const now = new Date();
    const result = await prisma.$executeRaw`
      INSERT INTO "ComentarioRecado" ("texto", "data", "recadoId", "autorId", "createdAt", "updatedAt")
      VALUES (${texto}, ${now}, ${recadoId}, ${session.user.id}, ${now}, ${now})
      RETURNING "id"
    `;
    
    const comentarioId = result ? (Array.isArray(result) && result.length > 0 ? result[0].id : null) : null;
    
    // Buscar dados do usuário para retornar com o comentário
    const usuario = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        tipoUsuario: true
      }
    });
    
    const comentario = {
      id: comentarioId,
      texto,
      data: now,
      recadoId,
      autorId: session.user.id,
      autor: usuario
    };
    
    // Notificar o autor do recado sobre o novo comentário (se não for ele mesmo)
    if (recado.autorId !== session.user.id) {
      try {
        const autorNome = session.user.name || 'Alguém';
        
        await prisma.notificacao.create({
          data: {
            titulo: 'Novo comentário em seu recado',
            mensagem: `${autorNome} comentou em seu recado: "${texto.substring(0, 50)}${texto.length > 50 ? '...' : ''}"`,
            usuarioId: recado.autorId,
            recadoId
          }
        });
      } catch (err) {
        console.error('Erro ao criar notificação para autor do recado:', err);
      }
    }
    
    return NextResponse.json(comentario, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    return NextResponse.json(
      { message: 'Erro ao adicionar comentário' },
      { status: 500 }
    );
  }
} 