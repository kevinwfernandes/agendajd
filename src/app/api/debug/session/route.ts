import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// GET /api/debug/session - Depurar dados da sessão atual
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Se não houver sessão
    if (!session) {
      return NextResponse.json({ 
        status: 'unauthenticated',
        message: 'Não há sessão ativa'
      });
    }
    
    // Retornar dados da sessão (omitindo informações sensíveis)
    return NextResponse.json({
      status: 'authenticated',
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        tipoUsuario: session.user.tipoUsuario || 'não definido',
        classeId: session.user.classeId || null
      }
    });
    
  } catch (error) {
    console.error('Erro ao obter dados da sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao obter dados da sessão' },
      { status: 500 }
    );
  }
} 