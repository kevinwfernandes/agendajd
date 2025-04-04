import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API de diagnóstico para verificar problemas com persistência de dados
 * 
 * Este endpoint testa a conexão com o banco de dados e tenta realizar operações de leitura e escrita
 * para diagnosticar problemas de persistência em produção.
 */

interface RecadoSimples {
  id: number;
  texto: string;
  data: Date;
  createdAt: Date;
  updatedAt: Date;
  autorId: string;
  autorNome: string;
}

interface RecadoDiagnostico {
  id: number;
  texto: string;
  createdAt: Date;
  autorId: string;
  autorNome: string;
}

interface DiagnosticoResultado {
  timestamp: string;
  ambiente: string | undefined;
  conexaoBD: boolean;
  erroConexao: string | null;
  testeEscrita: boolean;
  erroEscrita: string | null;
  recadosCriados: number;
  ultimosRecados: RecadoSimples[];
  recadoCriadoAgora: RecadoDiagnostico | null;
}

export async function GET() {
  const diagnostico: DiagnosticoResultado = {
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV,
    conexaoBD: false,
    erroConexao: null,
    testeEscrita: false,
    erroEscrita: null,
    recadosCriados: 0,
    ultimosRecados: [],
    recadoCriadoAgora: null,
  };

  try {
    // Testar conexão com o banco
    await prisma.$connect();
    diagnostico.conexaoBD = true;

    // Contar quantos recados já existem
    const contagemRecados = await prisma.recado.count();
    diagnostico.recadosCriados = contagemRecados;

    // Buscar os últimos 3 recados (se existirem)
    const ultimosRecados = await prisma.recado.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    diagnostico.ultimosRecados = ultimosRecados.map(r => ({
      id: r.id,
      texto: r.texto,
      data: r.data,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      autorId: r.autorId,
      autorNome: r.autor?.name || 'Desconhecido'
    }));

    // Criar recado de diagnóstico 
    try {
      // Buscar um usuário admin para associar ao recado de teste
      const adminUser = await prisma.user.findFirst({
        where: {
          tipoUsuario: {
            in: ['MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA']
          }
        },
        select: {
          id: true,
          name: true
        }
      });

      if (!adminUser) {
        throw new Error("Nenhum usuário administrador encontrado para criar o recado de teste");
      }

      // Criar recado de diagnóstico
      const recadoDiagnostico = await prisma.recado.create({
        data: {
          texto: `Recado de diagnóstico: ${new Date().toISOString()}`,
          global: true,
          autorId: adminUser.id
        },
        include: {
          autor: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      diagnostico.testeEscrita = true;
      diagnostico.recadoCriadoAgora = {
        id: recadoDiagnostico.id,
        texto: recadoDiagnostico.texto,
        createdAt: recadoDiagnostico.createdAt,
        autorId: recadoDiagnostico.autorId,
        autorNome: recadoDiagnostico.autor?.name || 'Desconhecido'
      };
    } catch (errorEscrita) {
      diagnostico.erroEscrita = errorEscrita instanceof Error 
        ? errorEscrita.message 
        : "Erro desconhecido ao tentar criar recado";
    }
  } catch (errorConexao) {
    diagnostico.erroConexao = errorConexao instanceof Error 
      ? errorConexao.message 
      : "Erro desconhecido ao conectar ao banco de dados";
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      console.error("Erro ao desconectar do banco de dados:", e);
    }
  }

  return NextResponse.json(diagnostico);
} 