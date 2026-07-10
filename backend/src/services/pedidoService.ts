import { prisma } from '../prismaClient';
import { notificarStatusPedido } from './whatsappService';
import type { FormaPagamento, TipoEntrega } from '@prisma/client';

// Taxa fixa de entrega — sem cálculo por distância por enquanto.
export const TAXA_ENTREGA = 8;

export class PedidoError extends Error {}

interface CriarPedidoParams {
  clienteId: string;
  formaPagamento: FormaPagamento;
  tipoEntrega: TipoEntrega;
  itens: { itemCardapioId: string; quantidade: number }[];
  cupomCodigo?: string;
  observacoes?: string;
  assinaturaId?: string;
}

// Lógica central de criação de pedido (nunca confia em preço/total vindo do
// chamador). Usada tanto pelo checkout normal quanto pela renovação
// automática de assinaturas.
export async function criarPedido(params: CriarPedidoParams) {
  const { clienteId, formaPagamento, tipoEntrega, itens, cupomCodigo, observacoes, assinaturaId } = params;

  const itemIds = itens.map((i) => i.itemCardapioId);
  const itensCardapio = await prisma.itemCardapio.findMany({
    where: { id: { in: itemIds }, ativo: true },
  });

  if (itensCardapio.length !== itemIds.length) {
    throw new PedidoError('Um ou mais itens do cardápio são inválidos ou estão inativos');
  }

  for (const pedidoItem of itens) {
    const itemCardapio = itensCardapio.find((i) => i.id === pedidoItem.itemCardapioId)!;
    if (itemCardapio.controlaEstoque && pedidoItem.quantidade > itemCardapio.qtdDisponivel) {
      throw new PedidoError(
        `Quantidade indisponível para "${itemCardapio.sabor}". Disponível: ${itemCardapio.qtdDisponivel}`
      );
    }
  }

  const subtotal = itens.reduce((total, pedidoItem) => {
    const itemCardapio = itensCardapio.find((i) => i.id === pedidoItem.itemCardapioId)!;
    return total + Number(itemCardapio.preco) * pedidoItem.quantidade;
  }, 0);

  let cupom = null;
  let valorDesconto = 0;
  if (cupomCodigo) {
    cupom = await prisma.cupom.findUnique({ where: { codigo: cupomCodigo.trim().toUpperCase() } });
    if (!cupom || !cupom.ativo) throw new PedidoError('Cupom inválido ou inativo');
    if (cupom.validoAte && cupom.validoAte < new Date()) throw new PedidoError('Cupom expirado');
    if (cupom.usosMaximos && cupom.usosAtuais >= cupom.usosMaximos) throw new PedidoError('Cupom esgotado');
    valorDesconto =
      cupom.tipo === 'PERCENTUAL'
        ? Math.min(subtotal, (subtotal * Number(cupom.valor)) / 100)
        : Math.min(subtotal, Number(cupom.valor));
  }

  const taxaEntrega = tipoEntrega === 'ENTREGA' ? TAXA_ENTREGA : 0;
  const valorTotal = Math.max(0, subtotal - valorDesconto) + taxaEntrega;

  const pedido = await prisma.$transaction(async (tx) => {
    const novoPedido = await tx.pedido.create({
      data: {
        clienteId,
        formaPagamento,
        tipoEntrega,
        taxaEntrega,
        cupomId: cupom?.id,
        valorDesconto,
        observacoes,
        valorTotal,
        assinaturaId,
        itens: {
          create: itens.map((i) => ({ itemCardapioId: i.itemCardapioId, quantidade: i.quantidade })),
        },
      },
      include: { itens: { include: { itemCardapio: true } }, cliente: true },
    });

    for (const pedidoItem of itens) {
      const itemCardapio = itensCardapio.find((i) => i.id === pedidoItem.itemCardapioId)!;
      if (!itemCardapio.controlaEstoque) continue;
      await tx.itemCardapio.update({
        where: { id: pedidoItem.itemCardapioId },
        data: { qtdDisponivel: { decrement: pedidoItem.quantidade } },
      });
    }

    if (cupom) {
      await tx.cupom.update({ where: { id: cupom.id }, data: { usosAtuais: { increment: 1 } } });
    }

    return novoPedido;
  });

  notificarStatusPedido('RECEBIDO', {
    nomeCliente: pedido.cliente.nome,
    telefone: pedido.cliente.telefone,
    numeroPedido: pedido.id.slice(0, 8),
    valorTotal: Number(pedido.valorTotal),
  }).catch((erro) => console.error('[WhatsApp] Erro inesperado:', erro));

  return pedido;
}
