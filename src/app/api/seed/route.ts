import { NextResponse } from 'next/server';
import { PrismaClient, TipoUsuario } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Verificar se já existe algum usuário administrador
    const existingAdmin = await prisma.user.findFirst({
      where: {
        tipoUsuario: TipoUsuario.MACOM_ADMIN_GERAL,
      },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Usuário administrador já existe', id: existingAdmin.id },
        { status: 200 }
      );
    }

    // Criar um hash da senha (admin123)
    const passwordHash = await hash('admin123', 10);

    // Criar o usuário administrador
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@agendajd.com',
        passwordHash,
        tipoUsuario: TipoUsuario.MACOM_ADMIN_GERAL,
      },
    });

    return NextResponse.json(
      { 
        message: 'Usuário administrador criado com sucesso', 
        id: admin.id,
        email: admin.email,
        password: 'admin123' // Apenas para facilitar o primeiro acesso
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário administrador' },
      { status: 500 }
    );
  }
} 