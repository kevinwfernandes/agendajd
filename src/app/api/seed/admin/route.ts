import { NextResponse } from 'next/server';
import { PrismaClient, TipoUsuario } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/seed/admin - Criar um usuário administrador geral via GET
export async function GET(request: Request) {
  try {
    // Verificar se a solicitação é feita localmente
    const host = request.headers.get('host') || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return NextResponse.json(
        { error: 'Esta API só pode ser acessada localmente' },
        { status: 403 }
      );
    }
    
    // Valores padrão para criação do admin
    const email = 'admin@agendajd.com';
    const password = 'Admin@123';
    const name = 'Administrador';
    
    // Verificar se já existe um usuário com este email
    const usuarioExistente = await prisma.user.findUnique({
      where: { email }
    });
    
    // Se já existe um usuário, verificar se é admin geral
    if (usuarioExistente) {
      // Atualizar para admin geral se não for
      if (usuarioExistente.tipoUsuario !== TipoUsuario.MACOM_ADMIN_GERAL) {
        const usuarioAtualizado = await prisma.user.update({
          where: { id: usuarioExistente.id },
          data: {
            tipoUsuario: TipoUsuario.MACOM_ADMIN_GERAL
          }
        });
        
        return NextResponse.json({
          message: 'Usuário já existente foi atualizado para administrador geral',
          usuario: {
            id: usuarioAtualizado.id,
            email: usuarioAtualizado.email,
            name: usuarioAtualizado.name,
            tipoUsuario: usuarioAtualizado.tipoUsuario
          }
        });
      }
      
      // Se já é admin geral, apenas informar
      return NextResponse.json({
        message: 'Este usuário já é um administrador geral',
        usuario: {
          id: usuarioExistente.id,
          email: usuarioExistente.email,
          name: usuarioExistente.name,
          tipoUsuario: usuarioExistente.tipoUsuario
        }
      });
    }
    
    // Criar hash da senha
    const passwordHash = await hash(password, 10);
    
    // Criar novo usuário admin geral
    const novoUsuario = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tipoUsuario: TipoUsuario.MACOM_ADMIN_GERAL,
      }
    });
    
    // Retornar dados do usuário criado (sem a senha)
    return NextResponse.json({
      message: 'Administrador geral criado com sucesso',
      usuario: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        name: novoUsuario.name,
        tipoUsuario: novoUsuario.tipoUsuario
      },
      credentials: {
        email,
        password
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário administrador', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/seed/admin - Criar um usuário administrador geral
export async function POST(request: Request) {
  try {
    // Verificar se a solicitação é feita localmente
    const host = request.headers.get('host') || '';
    if (!host.includes('localhost') && !host.includes('127.0.0.1')) {
      return NextResponse.json(
        { error: 'Esta API só pode ser acessada localmente' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Verificar presença de token de segurança (opcional)
    const apiToken = process.env.ADMIN_SEED_TOKEN;
    if (apiToken && data.token !== apiToken) {
      return NextResponse.json(
        { error: 'Token de segurança inválido' },
        { status: 401 }
      );
    }
    
    // Valores padrão se não forem fornecidos
    const email = data.email || 'admin@example.com';
    const password = data.password || 'Admin@123';
    const name = data.name || 'Administrador Geral';
    
    // Verificar se já existe um usuário com este email
    const usuarioExistente = await prisma.user.findUnique({
      where: { email }
    });
    
    // Se já existe um usuário, verificar se é admin geral
    if (usuarioExistente) {
      // Atualizar para admin geral se não for
      if (usuarioExistente.tipoUsuario !== TipoUsuario.MACOM_ADMIN_GERAL) {
        const usuarioAtualizado = await prisma.user.update({
          where: { id: usuarioExistente.id },
          data: {
            tipoUsuario: TipoUsuario.MACOM_ADMIN_GERAL,
            name: name // Atualizar nome se diferente
          }
        });
        
        return NextResponse.json({
          message: 'Usuário já existente foi atualizado para administrador geral',
          usuario: {
            id: usuarioAtualizado.id,
            email: usuarioAtualizado.email,
            name: usuarioAtualizado.name,
            tipoUsuario: usuarioAtualizado.tipoUsuario
          }
        });
      }
      
      // Se já é admin geral, apenas informar
      return NextResponse.json({
        message: 'Este usuário já é um administrador geral',
        usuario: {
          id: usuarioExistente.id,
          email: usuarioExistente.email,
          name: usuarioExistente.name,
          tipoUsuario: usuarioExistente.tipoUsuario
        }
      });
    }
    
    // Criar hash da senha
    const passwordHash = await hash(password, 10);
    
    // Criar novo usuário admin geral
    const novoUsuario = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        tipoUsuario: TipoUsuario.MACOM_ADMIN_GERAL,
      }
    });
    
    // Retornar dados do usuário criado (sem a senha)
    return NextResponse.json({
      message: 'Administrador geral criado com sucesso',
      usuario: {
        id: novoUsuario.id,
        email: novoUsuario.email,
        name: novoUsuario.name,
        tipoUsuario: novoUsuario.tipoUsuario
      },
      credentials: {
        email,
        password
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar usuário administrador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário administrador', details: String(error) },
      { status: 500 }
    );
  }
} 