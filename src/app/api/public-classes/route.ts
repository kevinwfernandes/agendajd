import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/public-classes - Listar todas as classes (pública, sem autenticação)
export async function GET() {
  try {
    // Listar todas as classes
    const classes = await prisma.classe.findMany({
      orderBy: {
        nome: 'asc'
      }
    });
    
    return NextResponse.json(classes);
    
  } catch (error) {
    console.error('Erro ao listar classes:', error);
    return NextResponse.json(
      { error: 'Erro ao listar classes' },
      { status: 500 }
    );
  }
} 