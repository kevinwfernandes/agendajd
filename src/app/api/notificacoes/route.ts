import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/notificacoes - Listar notificações do usuário
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar notificações do usuário
    const notificacoes = await prisma.notificacao.findMany({
      where: {
        usuarioId: session.user.id,
      },
      orderBy: {
        data: "desc",
      },
      include: {
        evento: {
          select: {
            id: true,
            titulo: true,
            data: true,
          },
        },
        recado: {
          select: {
            id: true,
            texto: true,
            data: true,
          },
        },
      },
    });

    return NextResponse.json(notificacoes);
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    return NextResponse.json(
      { error: "Erro ao listar notificações" },
      { status: 500 }
    );
  }
}

// POST /api/notificacoes - Marcar notificação como lida
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validar campos
    if (!data.id) {
      return NextResponse.json(
        { error: "ID da notificação é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se a notificação existe e pertence ao usuário
    const notificacao = await prisma.notificacao.findUnique({
      where: {
        id: data.id,
      },
    });

    if (!notificacao) {
      return NextResponse.json(
        { error: "Notificação não encontrada" },
        { status: 404 }
      );
    }

    if (notificacao.usuarioId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para acessar esta notificação" },
        { status: 403 }
      );
    }

    // Marcar como lida
    await prisma.notificacao.update({
      where: {
        id: data.id,
      },
      data: {
        lida: true,
      },
    });

    return NextResponse.json({ message: "Notificação marcada como lida" });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
    return NextResponse.json(
      { error: "Erro ao marcar notificação como lida" },
      { status: 500 }
    );
  }
} 