import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { hash } from 'bcrypt';
import { authOptions, isUserAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertAniversario } from '@/lib/aniversario';

export async function GET() {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }
    
    // Verificar permissões
    const userTipo = session.user.tipoUsuario;
    const isAdmin = isUserAdmin(userTipo);
    
    if (!isAdmin) {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
    
    // Buscar todos os usuários
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        tipoUsuario: true,
        classeId: true,
        createdAt: true,
        classe: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(users);
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { message: 'Erro ao listar usuários' },
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
    // @ts-expect-error - Contornando erro de tipo do Prisma
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
    const { name, email, password, tipoUsuario, classeId, dataNascimento } = await request.json();
    
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
    // @ts-expect-error - Contornando erro de tipo do Prisma
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
    // @ts-expect-error - Contornando erro de tipo do Prisma
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        tipoUsuario,
        classeId: classeId || null,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : null,
      },
    });
    
    // Criar registro de aniversário e adicionar ao calendário, se tiver data de nascimento
    if (dataNascimento) {
      try {
        await upsertAniversario(newUser.id, dataNascimento ? new Date(dataNascimento) : null);
      } catch (err) {
        console.error('Erro ao registrar aniversário:', err);
        // Continuamos mesmo com erro no registro de aniversário
      }
    }
    
    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        tipoUsuario: newUser.tipoUsuario,
        classeId: newUser.classeId,
        dataNascimento: newUser.dataNascimento,
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