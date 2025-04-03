import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';

const prisma = new PrismaClient();

// Classes predefinidas para o sistema
const classesPredefinidas = [
  {
    nome: "Sessão Maçônica",
    descricao: "Visível apenas para usuários maçons (admin, geral e maçons)"
  },
  {
    nome: "Reunião DeMolay",
    descricao: "Visível para DeMolays e maçons (admin ou não)"
  },
  {
    nome: "Reunião FDJ",
    descricao: "Visível para Filhas de Jó e maçons (admin ou não)"
  },
  {
    nome: "Reunião Fraterna",
    descricao: "Visível para Fraternas e maçons (admin ou não)"
  }
];

// GET /api/seed/classes - Criar classes predefinidas
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: 'Não autorizado',
        detalhes: 'Você precisa estar autenticado para acessar esta API'
      }, { status: 401 });
    }
    
    // Verificar se é administrador
    const userTipo = String(session.user.tipoUsuario || '');
    console.log("Tipo de usuário:", userTipo);
    
    // Facilitar teste - aceitar qualquer tipo de admin
    const isAdmin = userTipo.includes('ADMIN') || userTipo === 'MACOM_ADMIN_GERAL';
    
    if (!isAdmin) {
      return NextResponse.json({
        error: 'Apenas administradores podem criar classes predefinidas', 
        tipoUsuario: userTipo,
        session: session
      }, { status: 403 });
    }
    
    // Verificar classes existentes para não duplicar
    const classesExistentes = await prisma.classe.findMany({
      where: {
        nome: {
          in: classesPredefinidas.map(c => c.nome)
        }
      }
    });
    
    const classesJaExistentes = classesExistentes.map(c => c.nome);
    
    // Filtrar apenas classes que ainda não existem
    const classesParaCriar = classesPredefinidas.filter(
      c => !classesJaExistentes.includes(c.nome)
    );
    
    if (classesParaCriar.length === 0) {
      return NextResponse.json(
        { message: 'Todas as classes já existem no sistema', existentes: classesJaExistentes },
        { status: 200 }
      );
    }
    
    // Criar as classes que não existem
    const classesCriadas = await Promise.all(
      classesParaCriar.map(classe => 
        prisma.classe.create({
          data: classe
        })
      )
    );
    
    return NextResponse.json({
      message: `${classesCriadas.length} classes criadas com sucesso`,
      criadas: classesCriadas.map(c => c.nome),
      existentes: classesJaExistentes
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar classes predefinidas:', error);
    return NextResponse.json(
      { error: 'Erro ao criar classes predefinidas', detalhes: String(error) },
      { status: 500 }
    );
  }
} 