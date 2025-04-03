import { prisma } from '@/lib/prisma';

/**
 * Funções para gerenciamento de aniversários no sistema
 * 
 * Este módulo contém funções para:
 * - Criar/atualizar registros de aniversário
 * - Sincronizar aniversários com eventos no calendário
 * - Gerenciar notificações de aniversário
 */

/**
 * Adiciona ou atualiza um registro de aniversário para um usuário
 * e cria/atualiza um evento correspondente no calendário
 * 
 * @param userId ID do usuário
 * @param dataNascimento Data de nascimento do usuário
 * @returns O registro de aniversário criado/atualizado
 */
export async function upsertAniversario(userId: string, dataNascimento: Date | null) {
  try {
    if (!dataNascimento) {
      // Se não há data de nascimento, verificar se existe aniversário e remover
      const existingAniversario = await prisma.aniversario.findFirst({
        where: { usuarioId: userId }
      });
      
      if (existingAniversario) {
        // Remover o aniversário
        await prisma.aniversario.delete({
          where: { id: existingAniversario.id }
        });
        
        // Remover evento correspondente, se existir
        const existingEvento = await prisma.evento.findFirst({
          where: {
            titulo: { contains: 'Aniversário' },
            descricao: { contains: userId }
          }
        });
        
        if (existingEvento) {
          await prisma.evento.delete({
            where: { id: existingEvento.id }
          });
        }
      }
      
      return null;
    }
    
    // Buscar informações do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        classeId: true
      }
    });
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Criar ou atualizar registro de aniversário
    const aniversario = await prisma.aniversario.upsert({
      where: {
        id: (await prisma.aniversario.findFirst({
          where: { usuarioId: userId }
        }))?.id || 0
      },
      create: {
        data: dataNascimento,
        mensagem: `Aniversário de ${user.name}`,
        usuarioId: userId
      },
      update: {
        data: dataNascimento,
        mensagem: `Aniversário de ${user.name}`
      }
    });
    
    // Criar ou atualizar evento de aniversário no calendário
    // Configurar o evento para o ano atual
    const dataAniversarioAnoAtual = new Date(dataNascimento);
    dataAniversarioAnoAtual.setFullYear(new Date().getFullYear());
    
    // Formatar o nome para exibição
    const formattedName = user.name.split(' ')[0]; // Primeiro nome
    
    // Verificar se já existe um evento para este aniversário
    const existingEvento = await prisma.evento.findFirst({
      where: {
        descricao: { contains: userId }
      }
    });
    
    if (existingEvento) {
      // Atualizar evento existente
      await prisma.evento.update({
        where: { id: existingEvento.id },
        data: {
          titulo: `🎂 Aniversário: ${formattedName}`,
          descricao: `Aniversário de ${user.name}. [userId:${userId}]`,
          data: dataAniversarioAnoAtual,
          classeId: user.classeId,
          publico: true
        }
      });
    } else {
      // Criar novo evento para o aniversário
      // Usar o usuário admin como autor (ID do primeiro admin encontrado)
      const admin = await prisma.user.findFirst({
        where: {
          tipoUsuario: { in: ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'] }
        },
        select: { id: true }
      });
      
      const autorId = admin?.id || userId;
      
      await prisma.evento.create({
        data: {
          titulo: `🎂 Aniversário: ${formattedName}`,
          descricao: `Aniversário de ${user.name}. [userId:${userId}]`,
          data: dataAniversarioAnoAtual,
          classeId: user.classeId,
          publico: true,
          autorId
        }
      });
    }
    
    return aniversario;
  } catch (error) {
    console.error('Erro ao gerenciar aniversário:', error);
    throw error;
  }
}

/**
 * Sincroniza todos os aniversários com eventos no calendário
 * Atualiza as datas para o ano atual
 */
export async function syncAllAniversariosWithCalendar() {
  try {
    // Buscar todos os aniversários
    const aniversarios = await prisma.aniversario.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            classeId: true
          }
        }
      }
    });
    
    // Encontrar um admin para ser o autor dos eventos
    const admin = await prisma.user.findFirst({
      where: {
        tipoUsuario: { in: ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA'] }
      },
      select: { id: true }
    });
    
    if (!admin) {
      throw new Error('Nenhum administrador encontrado para criar eventos');
    }
    
    // Ano atual
    const anoAtual = new Date().getFullYear();
    
    // Para cada aniversário, criar ou atualizar um evento
    for (const aniversario of aniversarios) {
      const { usuario, data } = aniversario;
      
      if (!usuario) continue;
      
      // Configurar o evento para o ano atual mantendo mês e dia
      const dataAniversarioAnoAtual = new Date(data);
      dataAniversarioAnoAtual.setFullYear(anoAtual);
      
      // Formatar o nome para exibição
      const formattedName = usuario.name.split(' ')[0]; // Primeiro nome
      
      // Verificar se já existe um evento para este aniversário
      const existingEvento = await prisma.evento.findFirst({
        where: {
          descricao: { contains: usuario.id }
        }
      });
      
      if (existingEvento) {
        // Atualizar evento existente
        await prisma.evento.update({
          where: { id: existingEvento.id },
          data: {
            titulo: `🎂 Aniversário: ${formattedName}`,
            descricao: `Aniversário de ${usuario.name}. [userId:${usuario.id}]`,
            data: dataAniversarioAnoAtual,
            classeId: usuario.classeId,
            publico: true
          }
        });
      } else {
        // Criar novo evento para o aniversário
        await prisma.evento.create({
          data: {
            titulo: `🎂 Aniversário: ${formattedName}`,
            descricao: `Aniversário de ${usuario.name}. [userId:${usuario.id}]`,
            data: dataAniversarioAnoAtual,
            classeId: usuario.classeId,
            publico: true,
            autorId: admin.id
          }
        });
      }
    }
    
    return { success: true, count: aniversarios.length };
  } catch (error) {
    console.error('Erro ao sincronizar aniversários com calendário:', error);
    throw error;
  }
} 