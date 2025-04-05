import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { notifyAboutNewEvent as sendNotificationAboutNewEvent } from '@/lib/pushNotifications';

// Importar authOptions relativo ao projeto
import { authOptions } from '../../../lib/auth';

const prisma = new PrismaClient();

// Função auxiliar para verificar se um usuário tem acesso a uma classe específica
const usuarioPodeVerClasse = (tipoUsuario: string | undefined, nomeClasse: string): boolean => {
  if (!tipoUsuario) return false;
  
  // Sessão Maçônica - Visível apenas para usuários maçons (admin, geral e maçons)
  if (nomeClasse === "Sessão Maçônica") {
    return [
      'MACOM_ADMIN_GERAL',
     // 'ADMIN_DM',
     // 'ADMIN_FDJ',
     // 'ADMIN_FRATERNA',
      'MACOM'
    ].includes(tipoUsuario);
  }
  
  // Reunião DeMolay - Visível para DeMolays e maçons (admin ou não)
  if (nomeClasse === "Reunião DeMolay") {
    return [
      'MACOM_ADMIN_GERAL',
      'ADMIN_DM',
     // 'ADMIN_FDJ',
     // 'ADMIN_FRATERNA',
      'MACOM',
      'MEMBRO_DM'
    ].includes(tipoUsuario);
  }
  
  // Reunião FDJ - Visível para Filhas de Jó e maçons (admin ou não)
  if (nomeClasse === "Reunião FDJ") {
    return [
      'MACOM_ADMIN_GERAL',
     // 'ADMIN_DM',
      'ADMIN_FDJ',
     // 'ADMIN_FRATERNA',
      'MACOM',
      'MEMBRO_FDJ'
    ].includes(tipoUsuario);
  }
  
  // Reunião Fraterna - Visível para Fraternas e maçons (admin ou não)
  if (nomeClasse === "Reunião Fraterna") {
    return [
      'MACOM_ADMIN_GERAL',
     // 'ADMIN_DM',
    //  'ADMIN_FDJ',
      'ADMIN_FRATERNA',
      'MACOM',
      'MEMBRO_FRATERNA'
    ].includes(tipoUsuario);
  }
  
  // Para outras classes, manter o comportamento padrão
  return false;
};

// Função auxiliar para verificar se um usuário é administrador
const isUserAdmin = (tipoUsuario: string | undefined | null | number): boolean => {
  if (tipoUsuario === undefined || tipoUsuario === null) return false;
  
  // Converter para string para garantir compatibilidade
  const tipoUsuarioStr = String(tipoUsuario);
  
  const adminTypes = [
    'MACOM_ADMIN_GERAL',
    'ADMIN_DM',
    'ADMIN_FDJ',
    'ADMIN_FRATERNA'
  ];
  
  return adminTypes.includes(tipoUsuarioStr);
};

// GET /api/eventos - Listar eventos
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userTipo = session.user.tipoUsuario as string | undefined;
    const userClasseId = session.user.classeId as number | null | undefined;
    
    // Definir os filtros base para eventos
    const baseWhere: Prisma.EventoWhereInput = {};
    
    // Se não for administrador, aplicar filtros específicos
    if (!isUserAdmin(userTipo)) {
      // Buscar todas as classes para verificar acesso
      const todasClasses = await prisma.classe.findMany();
      
      // Identificar classes que o usuário pode ver com base em seu tipo
      const classesIdsPodeVer = todasClasses
        .filter(classe => usuarioPodeVerClasse(userTipo, classe.nome))
        .map(classe => classe.id);
      
      // Filtrar eventos:
      // 1. Eventos públicos
      // 2. Eventos da classe do usuário (se estiver em uma)
      // 3. Eventos de classes às quais o tipo de usuário tem acesso
      baseWhere.OR = [
        { publico: true }
      ];
      
      // Adicionar classe do usuário se tiver uma
      if (userClasseId) {
        baseWhere.OR.push({ classeId: userClasseId });
      }
      
      // Adicionar classes às quais o tipo de usuário tem acesso
      if (classesIdsPodeVer.length > 0) {
        baseWhere.OR.push({ classeId: { in: classesIdsPodeVer } });
      }
    }
    
    // Buscar eventos
    const eventos = await prisma.evento.findMany({
      where: baseWhere,
      orderBy: {
        data: 'asc',
      },
      include: {
        classe: {
          select: {
            id: true,
            nome: true,
          },
        },
        autor: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(eventos);
  } catch (error) {
    console.error('Erro ao listar eventos:', error);
    return NextResponse.json(
      { error: 'Erro ao listar eventos' },
      { status: 500 }
    );
  }
}

// POST /api/eventos - Criar evento
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    console.log('Tipo de usuário ao criar evento:', session.user.tipoUsuario, 'tipo:', typeof session.user.tipoUsuario);
    
    // Verificar se é administrador
    if (!isUserAdmin(session.user.tipoUsuario)) {
      return NextResponse.json(
        { error: 'Apenas administradores podem criar eventos' },
        { status: 403 }
      );
    }
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Validar campos obrigatórios
    if (!data.titulo || !data.data) {
      return NextResponse.json(
        { error: 'Título e data são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Criar evento
    const evento = await prisma.evento.create({
      data: {
        titulo: data.titulo,
        descricao: data.descricao || '',
        data: new Date(data.data),
        publico: data.publico || false,
        sincGCalendar: data.sincGCalendar || false,
        classeId: data.classeId ? Number(data.classeId) : null,
        autorId: session.user.id,
      },
      include: {
        classe: true
      }
    });
    
    // Enviar notificações push sobre o novo evento
    try {
      await sendNotificationAboutNewEvent(evento);
    } catch (err) {
      console.error('Erro ao enviar notificações push:', err);
      // Continuar mesmo com erro nas notificações
    }
    
    return NextResponse.json(evento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json(
      { error: 'Erro ao criar evento' },
      { status: 500 }
    );
  }
} 