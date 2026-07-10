import { prisma } from '../prismaClient';
import { criarPedido, PedidoError } from './pedidoService';
import type { Periodicidade } from '@prisma/client';

export function proximaDataApos(data: Date, periodicidade: Periodicidade): Date {
  const proxima = new Date(data);
  if (periodicidade === 'SEMANAL') proxima.setDate(proxima.getDate() + 7);
  else if (periodicidade === 'QUINZENAL') proxima.setDate(proxima.getDate() + 14);
  else proxima.setMonth(proxima.getMonth() + 1);
  return proxima;
}

// Busca assinaturas ativas vencidas e gera o próximo pedido de cada uma.
// Roda isolada por assinatura: se uma falhar (ex.: sem estoque no momento),
// as demais continuam e a que falhou tenta de novo na próxima varredura.
export async function renovarAssinaturasVencidas() {
  const vencidas = await prisma.assinatura.findMany({
    where: { status: 'ATIVA', proximoPedidoEm: { lte: new Date() } },
  });

  for (const assinatura of vencidas) {
    try {
      const itens = assinatura.itensPadrao as unknown as { itemCardapioId: string; quantidade: number }[];
      await criarPedido({
        clienteId: assinatura.clienteId,
        formaPagamento: assinatura.formaPagamento,
        tipoEntrega: assinatura.tipoEntrega,
        itens,
        assinaturaId: assinatura.id,
      });
      await prisma.assinatura.update({
        where: { id: assinatura.id },
        data: { proximoPedidoEm: proximaDataApos(assinatura.proximoPedidoEm, assinatura.periodicidade) },
      });
    } catch (erro) {
      console.error(
        `[Assinaturas] Falha ao renovar ${assinatura.id}:`,
        erro instanceof PedidoError ? erro.message : erro
      );
    }
  }

  return vencidas.length;
}

export function iniciarAgendadorAssinaturas() {
  const UMA_HORA = 60 * 60 * 1000;
  renovarAssinaturasVencidas().catch((erro) => console.error('[Assinaturas] Erro na varredura inicial:', erro));
  setInterval(() => {
    renovarAssinaturasVencidas().catch((erro) => console.error('[Assinaturas] Erro na varredura:', erro));
  }, UMA_HORA);
}
