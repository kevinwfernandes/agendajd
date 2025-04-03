import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/debug/session - Obter informações de depuração da sessão
export async function GET() {
  try {
    // Obter dados da sessão
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        authenticated: false,
        message: "Usuário não autenticado"
      });
    }

    // Obter informações adicionais para depuração
    const userInfo = {
      status: "authenticated",
      user: {
        ...session.user,
        tipoUsuario: {
          tipo: session.user.tipoUsuario || "undefined",
          string: typeof session.user.tipoUsuario,
          equalsToMACOM_ADMIN_GERAL: session.user.tipoUsuario === "MACOM_ADMIN_GERAL",
          equalsToMACOM_ADMIN_GERAL_asString: String(session.user.tipoUsuario) === "MACOM_ADMIN_GERAL",
          incluidoNoArray: ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'].includes(
            session.user.tipoUsuario as string
          )
        }
      },
      session
    };
    
    return NextResponse.json(userInfo);
    
  } catch (error) {
    console.error('Erro ao obter informações da sessão:', error);
    return NextResponse.json(
      { error: 'Erro ao processar os dados da sessão' },
      { status: 500 }
    );
  }
} 