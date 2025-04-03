import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// POST /api/push/subscribe - Inscrever para notificações push
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    
    // Validar dados da requisição
    if (!data.subscription || !data.subscription.endpoint) {
      return NextResponse.json(
        { error: "Dados de inscrição inválidos" },
        { status: 400 }
      );
    }

    const { endpoint, keys, expirationTime } = data.subscription;
    
    // Verificar se a inscrição já existe
    const existingSubscription = await prisma.pushSubscription.findUnique({
      where: {
        endpoint: endpoint,
      },
    });

    if (existingSubscription) {
      // Atualizar a inscrição existente
      await prisma.pushSubscription.update({
        where: {
          endpoint: endpoint,
        },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          expirationTime: expirationTime ? new Date(expirationTime) : null,
          usuarioId: session.user.id,
        },
      });
    } else {
      // Criar nova inscrição
      await prisma.pushSubscription.create({
        data: {
          endpoint: endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          expirationTime: expirationTime ? new Date(expirationTime) : null,
          usuarioId: session.user.id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao salvar inscrição push:", error);
    return NextResponse.json(
      { error: "Erro ao salvar inscrição push" },
      { status: 500 }
    );
  }
}

// DELETE /api/push/subscribe - Cancelar inscrição de notificações push
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint não fornecido" },
        { status: 400 }
      );
    }

    // Verificar se a inscrição existe
    const subscription = await prisma.pushSubscription.findUnique({
      where: {
        endpoint: endpoint,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Inscrição não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se pertence ao usuário atual
    if (subscription.usuarioId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para cancelar esta inscrição" },
        { status: 403 }
      );
    }

    // Remover a inscrição
    await prisma.pushSubscription.delete({
      where: {
        endpoint: endpoint,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao cancelar inscrição push:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar inscrição push" },
      { status: 500 }
    );
  }
} 