import { NextResponse } from "next/server";
import { PrismaClient, TipoUsuario } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/eventos/[id] - Obter detalhes de um evento
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }

    // Buscar evento
    const evento = await prisma.evento.findUnique({
      where: {
        id,
      },
      include: {
        classe: {
          select: {
            id: true,
            nome: true,
          },
        },
        autor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para ver este evento
    const userTipo = session.user.tipoUsuario as TipoUsuario;
    const userClasseId = session.user.classeId as number | null;
    
    const isAdmin = userTipo === TipoUsuario.MACOM_ADMIN_GERAL || 
                  userTipo === TipoUsuario.ADMIN_DM || 
                  userTipo === TipoUsuario.ADMIN_FDJ || 
                  userTipo === TipoUsuario.ADMIN_FRATERNA;

    // Se não for admin, verificar se tem acesso
    if (!isAdmin && !evento.publico && evento.classeId !== userClasseId) {
      return NextResponse.json(
        { error: "Acesso negado a este evento" },
        { status: 403 }
      );
    }

    return NextResponse.json(evento);
  } catch (error) {
    console.error("Erro ao obter evento:", error);
    return NextResponse.json(
      { error: "Erro ao obter evento" },
      { status: 500 }
    );
  }
}

// PUT /api/eventos/[id] - Atualizar evento
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }

    // Verificar se o evento existe
    const eventoExistente = await prisma.evento.findUnique({
      where: {
        id,
      },
    });

    if (!eventoExistente) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões (apenas admin ou autor do evento)
    const userTipo = session.user.tipoUsuario as TipoUsuario;
    
    const isAdmin = userTipo === TipoUsuario.MACOM_ADMIN_GERAL || 
                  userTipo === TipoUsuario.ADMIN_DM || 
                  userTipo === TipoUsuario.ADMIN_FDJ || 
                  userTipo === TipoUsuario.ADMIN_FRATERNA;
    const isAutor = eventoExistente.autorId === session.user.id;

    if (!isAdmin && !isAutor) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este evento" },
        { status: 403 }
      );
    }

    // Obter dados do corpo da requisição
    const data = await request.json();

    // Validar campos obrigatórios
    if (!data.titulo || !data.data) {
      return NextResponse.json(
        { error: "Título e data são obrigatórios" },
        { status: 400 }
      );
    }

    // Atualizar evento
    const eventoAtualizado = await prisma.evento.update({
      where: {
        id,
      },
      data: {
        titulo: data.titulo,
        descricao: data.descricao || "",
        data: new Date(data.data),
        publico: data.publico || false,
        sincGCalendar: data.sincGCalendar || false,
        classeId: data.classeId || null,
      },
    });

    return NextResponse.json(eventoAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar evento" },
      { status: 500 }
    );
  }
}

// DELETE /api/eventos/[id] - Excluir evento
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID do evento inválido" },
        { status: 400 }
      );
    }

    // Verificar se o evento existe
    const eventoExistente = await prisma.evento.findUnique({
      where: {
        id,
      },
    });

    if (!eventoExistente) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões (apenas admin ou autor do evento)
    const userTipo = session.user.tipoUsuario as TipoUsuario;
    
    const isAdmin = userTipo === TipoUsuario.MACOM_ADMIN_GERAL || 
                  userTipo === TipoUsuario.ADMIN_DM || 
                  userTipo === TipoUsuario.ADMIN_FDJ || 
                  userTipo === TipoUsuario.ADMIN_FRATERNA;
    const isAutor = eventoExistente.autorId === session.user.id;

    if (!isAdmin && !isAutor) {
      return NextResponse.json(
        { error: "Você não tem permissão para excluir este evento" },
        { status: 403 }
      );
    }

    // Excluir evento
    await prisma.evento.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Evento excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return NextResponse.json(
      { error: "Erro ao excluir evento" },
      { status: 500 }
    );
  }
} 