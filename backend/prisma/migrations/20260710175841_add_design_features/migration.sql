-- CreateEnum
CREATE TYPE "CargoAdmin" AS ENUM ('DONA', 'COZINHA', 'ATENDIMENTO');

-- CreateEnum
CREATE TYPE "TipoDesconto" AS ENUM ('PERCENTUAL', 'FIXO');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "StatusAssinatura" AS ENUM ('ATIVA', 'PAUSADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoEntrega" AS ENUM ('ENTREGA', 'RETIRADA');

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN     "cargo" "CargoAdmin" NOT NULL DEFAULT 'DONA';

-- AlterTable
ALTER TABLE "ItemCardapio" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "assinaturaId" TEXT,
ADD COLUMN     "cupomId" TEXT,
ADD COLUMN     "taxaEntrega" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tipoEntrega" "TipoEntrega" NOT NULL DEFAULT 'ENTREGA',
ADD COLUMN     "valorDesconto" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AdminConvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cargo" "CargoAdmin" NOT NULL DEFAULT 'ATENDIMENTO',
    "token" TEXT NOT NULL,
    "aceitoEm" TIMESTAMP(3),
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminConvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cupom" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoDesconto" NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "validoAte" TIMESTAMP(3),
    "usosMaximos" INTEGER,
    "usosAtuais" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cupom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoNegocio" (
    "id" TEXT NOT NULL,
    "nomeNegocio" TEXT NOT NULL DEFAULT 'Dona Adilma',
    "telefone" TEXT NOT NULL DEFAULT '',
    "endereco" TEXT NOT NULL DEFAULT '',
    "horarios" JSONB NOT NULL DEFAULT '{}',
    "pagamentosAceitos" TEXT[] DEFAULT ARRAY['PIX', 'CARTAO', 'DINHEIRO']::TEXT[],
    "notificarNovoPedido" BOOLEAN NOT NULL DEFAULT true,
    "resumoSemanalEmail" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assinatura" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "status" "StatusAssinatura" NOT NULL DEFAULT 'ATIVA',
    "itensPadrao" JSONB NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "tipoEntrega" "TipoEntrega" NOT NULL DEFAULT 'ENTREGA',
    "proximoPedidoEm" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assinatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminConvite_token_key" ON "AdminConvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Cupom_codigo_key" ON "Cupom"("codigo");

-- AddForeignKey
ALTER TABLE "Assinatura" ADD CONSTRAINT "Assinatura_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cupomId_fkey" FOREIGN KEY ("cupomId") REFERENCES "Cupom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_assinaturaId_fkey" FOREIGN KEY ("assinaturaId") REFERENCES "Assinatura"("id") ON DELETE SET NULL ON UPDATE CASCADE;
