import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '../../../../lib/auth';

const prisma = new PrismaClient();

// GET /api/admin/classes - Listar todas as classes
export async function GET() {
  try {
    // Remover verificação de autenticação para listar as classes
    // Isso permite que o componente ClasseSelector carregue as classes
    // sem precisar de autenticação
    
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

// POST /api/admin/classes - Criar uma nova classe
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é administrador (qualquer tipo)
    const userTipo = String(session.user.tipoUsuario || '');
    const isAdmin = userTipo.includes('ADMIN') || userTipo === 'MACOM_ADMIN_GERAL';
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar classes' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Validar campos obrigatórios
    if (!data.nome) {
      return NextResponse.json(
        { error: 'Nome da classe é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe uma classe com este nome
    const classeExistente = await prisma.classe.findUnique({
      where: { nome: data.nome }
    });
    
    if (classeExistente) {
      return NextResponse.json(
        { error: 'Já existe uma classe com este nome', classe: classeExistente },
        { status: 409 }
      );
    }
    
    // Criar nova classe
    const novaClasse = await prisma.classe.create({
      data: {
        nome: data.nome,
        descricao: data.descricao || ''
      }
    });
    
    return NextResponse.json(novaClasse, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar classe:', error);
    return NextResponse.json(
      { error: 'Erro ao criar classe' },
      { status: 500 }
    );
  }
} 