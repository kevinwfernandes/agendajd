import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Buscar o usuário no banco para verificar suas permissões
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { tipoUsuario: true },
    });
    
    // Verificar se é administrador
    if (!user || !['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(user.tipoUsuario || '')) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true,
        classeId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Buscar o usuário no banco para verificar suas permissões
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { tipoUsuario: true },
    });
    
    // Verificar se é administrador
    if (!adminUser || !['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(adminUser.tipoUsuario || '')) {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }
    
    // Obter os dados do request
    const { name, email, password, tipoUsuario, classeId } = await request.json();
    
    // Validar campos obrigatórios
    if (!name || !email || !password || !tipoUsuario) {
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário é admin geral para poder criar outros admins
    if (
      adminUser.tipoUsuario !== 'MACOM_ADMIN_GERAL' && 
      ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(tipoUsuario)
    ) {
      return NextResponse.json(
        { error: 'Apenas administradores gerais podem criar outros administradores' },
        { status: 403 }
      );
    }
    
    // Verificar se o email já está em uso
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está sendo utilizado' },
        { status: 409 }
      );
    }
    
    // Criar hash da senha
    const passwordHash = await hash(password, 10);
    
    // Criar o usuário
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        tipoUsuario,
        classeId: classeId || null,
      },
    });
    
    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tipoUsuario: newUser.tipoUsuario,
        classeId: newUser.classeId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 