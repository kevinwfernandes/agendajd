-- CreateTable
CREATE TABLE "ComentarioRecado" (
    "id" SERIAL NOT NULL,
    "texto" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "recadoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioRecado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComentarioRecado_autorId_idx" ON "ComentarioRecado"("autorId");

-- CreateIndex
CREATE INDEX "ComentarioRecado_data_idx" ON "ComentarioRecado"("data");

-- AddForeignKey
ALTER TABLE "ComentarioRecado" ADD CONSTRAINT "ComentarioRecado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioRecado" ADD CONSTRAINT "ComentarioRecado_recadoId_fkey" FOREIGN KEY ("recadoId") REFERENCES "Recado"("id") ON DELETE CASCADE ON UPDATE CASCADE; 