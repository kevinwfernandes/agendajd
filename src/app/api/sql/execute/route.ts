import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const prisma = new PrismaClient();

// POST /api/sql/execute - Executa uma query SQL diretamente
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
    
    if (!data.query) {
      return NextResponse.json(
        { error: 'A query SQL é obrigatória' },
        { status: 400 }
      );
    }
    
    // Caso específico para atualizar tipo de usuário para administrador geral
    if (data.query.includes('SET "tipoUsuario" = \'MACOM_ADMIN_GERAL\'') && 
        data.params && data.params.length > 0) {
      
      const email = data.params[0];
      
      // Fazer update no formato raw mas com parâmetros seguros
      const result = await prisma.$executeRaw`
        UPDATE "users" 
        SET "tipoUsuario" = 'MACOM_ADMIN_GERAL' 
        WHERE "email" = ${email}
      `;
      
      return NextResponse.json({
        message: 'Usuário atualizado com sucesso',
        resultado: result > 0 ? 'Atualizado' : 'Nenhum usuário encontrado'
      });
    }
    
    // Por segurança, não permitir outras queries
    return NextResponse.json({
      error: 'Apenas queries específicas são permitidas por esta API'
    }, { status: 403 });
    
  } catch (error) {
    console.error('Erro ao executar SQL:', error);
    return NextResponse.json(
      { error: 'Erro ao executar SQL', details: String(error) },
      { status: 500 }
    );
  }
} 