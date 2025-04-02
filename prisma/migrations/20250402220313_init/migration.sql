-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('MACOM_ADMIN_GERAL', 'ADMIN_DM', 'ADMIN_FDJ', 'ADMIN_FRATERNA', 'MACOM', 'MEMBRO_DM', 'MEMBRO_FDJ', 'MEMBRO_FRATERNA');

-- CreateTable
CREATE TABLE "Classe" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipoUsuario" "TipoUsuario" NOT NULL,
    "dataNascimento" TIMESTAMP(3),
    "telefone" TEXT,
    "foto" TEXT,
    "classeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "publico" BOOLEAN NOT NULL DEFAULT false,
    "sincGCalendar" BOOLEAN NOT NULL DEFAULT false,
    "classeId" INTEGER,
    "autorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recado" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "global" BOOLEAN NOT NULL DEFAULT false,
    "classeId" INTEGER,
    "autorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacao" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" INTEGER NOT NULL,
    "eventoId" INTEGER,
    "recadoId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioEvento" (
    "id" SERIAL NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "usuarioId" INTEGER NOT NULL,
    "eventoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsuarioEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aniversario" (
    "id" SERIAL NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "mensagem" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Aniversario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Classe_nome_key" ON "Classe"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_classeId_idx" ON "Usuario"("classeId");

-- CreateIndex
CREATE INDEX "Usuario_tipoUsuario_idx" ON "Usuario"("tipoUsuario");

-- CreateIndex
CREATE INDEX "Evento_data_idx" ON "Evento"("data");

-- CreateIndex
CREATE INDEX "Evento_classeId_idx" ON "Evento"("classeId");

-- CreateIndex
CREATE INDEX "Evento_publico_idx" ON "Evento"("publico");

-- CreateIndex
CREATE INDEX "Recado_data_idx" ON "Recado"("data");

-- CreateIndex
CREATE INDEX "Recado_classeId_idx" ON "Recado"("classeId");

-- CreateIndex
CREATE INDEX "Recado_global_idx" ON "Recado"("global");

-- CreateIndex
CREATE INDEX "Notificacao_usuarioId_idx" ON "Notificacao"("usuarioId");

-- CreateIndex
CREATE INDEX "Notificacao_lida_idx" ON "Notificacao"("lida");

-- CreateIndex
CREATE INDEX "Notificacao_data_idx" ON "Notificacao"("data");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioEvento_usuarioId_eventoId_key" ON "UsuarioEvento"("usuarioId", "eventoId");

-- CreateIndex
CREATE INDEX "Aniversario_data_idx" ON "Aniversario"("data");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recado" ADD CONSTRAINT "Recado_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recado" ADD CONSTRAINT "Recado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacao" ADD CONSTRAINT "Notificacao_recadoId_fkey" FOREIGN KEY ("recadoId") REFERENCES "Recado"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEvento" ADD CONSTRAINT "UsuarioEvento_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEvento" ADD CONSTRAINT "UsuarioEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aniversario" ADD CONSTRAINT "Aniversario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
