import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/classes - Obter lista de classes
export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar todas as classes
    const classes = await prisma.classe.findMany({
      orderBy: {
        nome: 'asc'
      },
      select: {
        id: true,
        nome: true,
        descricao: true
      }
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Erro ao buscar classes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar classes" },
      { status: 500 }
    );
  }
} 