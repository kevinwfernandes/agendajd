import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const prisma = new PrismaClient();

// POST /api/admin/atualizar-usuario - Atualizar usuário para administrador geral
export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
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
    
    // Valor padrão se não for fornecido
    const email = data.email || 'admin@agendajd.com';
    
    // Atualizar o usuário para administrador geral
    const result = await prisma.$executeRaw`
      UPDATE "users" 
      SET "tipoUsuario" = 'MACOM_ADMIN_GERAL' 
      WHERE "email" = ${email}
    `;
    
    return NextResponse.json({
      message: 'Usuário atualizado para administrador geral com sucesso',
      resultado: result > 0 ? 'Atualizado' : 'Nenhum usuário encontrado'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário', details: String(error) },
      { status: 500 }
    );
  }
} 