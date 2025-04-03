import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const prisma = new PrismaClient();

// Função auxiliar para verificar se um usuário é administrador
const isUserAdmin = (tipoUsuario: string | undefined): boolean => {
  if (!tipoUsuario) return false;
  
  const adminTypes = [
    'MACOM_ADMIN_GERAL',
    'ADMIN_DM',
    'ADMIN_FDJ',
    'ADMIN_FRATERNA'
  ];
  
  return adminTypes.includes(tipoUsuario);
};

// Função auxiliar para obter as classes que um usuário pode gerenciar
const getClassesParaUsuario = async (tipoUsuario: string): Promise<string[]> => {
  const classesPermitidas: string[] = [];
  
  // Administrador geral pode ver todas as classes
  if (tipoUsuario === 'MACOM_ADMIN_GERAL') {
    return ['Sessão Maçônica', 'Reunião DeMolay', 'Reunião FDJ', 'Reunião Fraterna'];
  }
  
  // Adicionar classes específicas com base no tipo de administrador
  if (tipoUsuario === 'ADMIN_DM' || tipoUsuario === 'MACOM') {
    classesPermitidas.push('Reunião DeMolay');
  }
  
  if (tipoUsuario === 'ADMIN_FDJ' || tipoUsuario === 'MACOM') {
    classesPermitidas.push('Reunião FDJ');
  }
  
  if (tipoUsuario === 'ADMIN_FRATERNA' || tipoUsuario === 'MACOM') {
    classesPermitidas.push('Reunião Fraterna');
  }
  
  // Sessão Maçônica só está disponível para administradores maçônicos ou maçons
  if (tipoUsuario === 'MACOM_ADMIN_GERAL' || 
      tipoUsuario === 'ADMIN_DM' || 
      tipoUsuario === 'ADMIN_FDJ' || 
      tipoUsuario === 'ADMIN_FRATERNA' || 
      tipoUsuario === 'MACOM') {
    classesPermitidas.push('Sessão Maçônica');
  }
  
  return classesPermitidas;
};

// GET /api/eventos/classes-disponiveis - Obter classes disponíveis para eventos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userTipo = session.user.tipoUsuario as string;
    
    // Apenas administradores podem criar eventos
    if (!isUserAdmin(userTipo)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar eventos' },
        { status: 403 }
      );
    }
    
    // Obter nomes de classes que o usuário pode gerenciar
    const classesPermitidas = await getClassesParaUsuario(userTipo);
    
    // Buscar detalhes completos das classes permitidas
    const classes = await prisma.classe.findMany({
      where: {
        nome: {
          in: classesPermitidas
        }
      },
      select: {
        id: true,
        nome: true,
        descricao: true
      }
    });
    
    return NextResponse.json(classes);
  } catch (error) {
    console.error('Erro ao listar classes disponíveis:', error);
    return NextResponse.json(
      { error: 'Erro ao listar classes disponíveis' },
      { status: 500 }
    );
  }
} 