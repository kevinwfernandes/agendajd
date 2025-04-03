// @ts-check
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Criar classes predefinidas
  console.log('Criando classes predefinidas...');
  const classesPredefinidas = [
    {
      nome: 'Sessão Maçônica',
      descricao: 'Eventos visíveis apenas para Maçons (admins e membros regulares)'
    },
    {
      nome: 'Reunião DeMolay',
      descricao: 'Eventos visíveis para DeMolays e Maçons (admins ou não)'
    },
    {
      nome: 'Reunião FDJ',
      descricao: 'Eventos visíveis para Filhas de Jó e Maçons (admins ou não)'
    },
    {
      nome: 'Reunião Fraterna',
      descricao: 'Eventos visíveis para Fraternas e Maçons (admins ou não)'
    }
  ];

  let classesInseridas = 0;

  // Verificar cada classe e criar se não existir
  for (const classe of classesPredefinidas) {
    const classeExistente = await prisma.classe.findUnique({
      where: { nome: classe.nome }
    });

    if (!classeExistente) {
      await prisma.classe.create({
        data: classe
      });
      classesInseridas++;
      console.log(`Classe "${classe.nome}" criada com sucesso.`);
    } else {
      console.log(`Classe "${classe.nome}" já existe, pulando...`);
    }
  }

  console.log(`${classesInseridas} classes foram criadas.`);

  // Criar usuário administrador padrão
  console.log('Verificando se o administrador já existe...');
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@agendajd.com.br';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  const adminName = process.env.ADMIN_NAME || 'Administrador Geral';
  
  // @ts-expect-error - O Prisma tem tipagem para user
  const adminExistente = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminExistente) {
    // Gerar hash da senha
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    // Criar administrador
    // @ts-expect-error - O Prisma tem tipagem para user
    await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        passwordHash,
        tipoUsuario: 'MACOM_ADMIN_GERAL',
        emailVerified: new Date()
      }
    });
    
    console.log(`Administrador criado com sucesso! Email: ${adminEmail}`);
    console.log('IMPORTANTE: Altere a senha do administrador após o primeiro login.');
  } else {
    console.log('Administrador já existe, pulando...');
  }

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 