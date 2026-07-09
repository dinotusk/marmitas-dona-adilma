import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { requireAdmin } from '../middleware/auth';
import { StatusPedido, StatusUnidade } from '@prisma/client';
import { notificarStatusPedido } from '../services/whatsappService';

const router = Router();

// ---------- CLIENTE: criar pedido (HU001) ----------
const criarPedidoSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().min(8),
  endereco: z.string().min(1),
  formaPagamento: z.enum(['PIX', 'CARTAO', 'DINHEIRO']),
  observacoes: z.string().optional(),
  itens: z
    .array(
      z.object({
        itemCardapioId: z.string().uuid(),
        quantidade: z.number().int().positive(),
      })
    )
    .min(1),
});

router.post('/', async (req, res) => {
  const parsed = criarPedidoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { nome, telefone, endereco, formaPagamento, observacoes, itens } = parsed.data;

  // Busca preços reais no banco para calcular o total (nunca confiar no valor vindo do cliente)
  const itemIds = itens.map((i) => i.itemCardapioId);
  const itensCardapio = await prisma.itemCardapio.findMany({
    where: { id: { in: itemIds }, ativo: true },
  });

  if (itensCardapio.length !== itemIds.length) {
    return res.status(400).json({ erro: 'Um ou mais itens do cardápio são inválidos ou estão inativos' });
  }

  // Verifica disponibilidade de estoque
  for (const pedidoItem of itens) {
    const itemCardapio = itensCardapio.find((i) => i.id === pedidoItem.itemCardapioId)!;
    if (pedidoItem.quantidade > itemCardapio.qtdDisponivel) {
      return res.status(400).json({
        erro: `Quantidade indisponível para "${itemCardapio.sabor}". Disponível: ${itemCardapio.qtdDisponivel}`,
      });
    }
  }

  const valorTotal = itens.reduce((total, pedidoItem) => {
    const itemCardapio = itensCardapio.find((i) => i.id === pedidoItem.itemCardapioId)!;
    return total + Number(itemCardapio.preco) * pedidoItem.quantidade;
  }, 0);

  // Upsert do cliente por telefone (RN011 - histórico de clientes)
  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome, endereco },
    create: { nome, telefone, endereco },
  });

  const pedido = await prisma.$transaction(async (tx) => {
    const novoPedido = await tx.pedido.create({
      data: {
        clienteId: cliente.id,
        formaPagamento,
        observacoes,
        valorTotal,
        itens: {
          create: itens.map((i) => ({
            itemCardapioId: i.itemCardapioId,
            quantidade: i.quantidade,
          })),
        },
      },
      include: { itens: { include: { itemCardapio: true } }, cliente: true },
    });

    // Abate o estoque disponível
    for (const pedidoItem of itens) {
      await tx.itemCardapio.update({
        where: { id: pedidoItem.itemCardapioId },
        data: { qtdDisponivel: { decrement: pedidoItem.quantidade } },
      });
    }

    return novoPedido;
  });

  notificarStatusPedido('RECEBIDO', {
    nomeCliente: pedido.cliente.nome,
    telefone: pedido.cliente.telefone,
    numeroPedido: pedido.id.slice(0, 8),
    valorTotal: Number(pedido.valorTotal),
  }).catch((erro) => console.error('[WhatsApp] Erro inesperado:', erro));

  res.status(201).json(pedido);
});

// ---------- CLIENTE: acompanhar pedido (HU003) ----------
router.get('/:id', async (req, res) => {
  const pedido = await prisma.pedido.findUnique({
    where: { id: req.params.id },
    include: { itens: { include: { itemCardapio: true } }, cliente: true },
  });

  if (!pedido) {
    return res.status(404).json({ erro: 'Pedido não encontrado' });
  }

  res.json(pedido);
});

// ---------- ADMIN: painel de pedidos (HU002) ----------
router.get('/', requireAdmin, async (req, res) => {
  const statusFiltro = req.query.status as StatusPedido | undefined;

  const pedidos = await prisma.pedido.findMany({
    where: statusFiltro ? { status: statusFiltro } : undefined,
    include: { itens: { include: { itemCardapio: true } }, cliente: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(pedidos);
});

// ---------- ADMIN: atualizar status geral do pedido (RN003) ----------
const statusSchema = z.object({
  status: z.nativeEnum(StatusPedido),
});

router.patch('/:id/status', requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Status inválido' });
  }

  const pedido = await prisma.pedido.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
    include: { itens: { include: { itemCardapio: true } }, cliente: true },
  });

  // RN006: dispara notificação via WhatsApp. Roda em segundo plano —
  // se falhar, não deve impedir a resposta da atualização de status.
  notificarStatusPedido(pedido.status, {
    nomeCliente: pedido.cliente.nome,
    telefone: pedido.cliente.telefone,
    numeroPedido: pedido.id.slice(0, 8),
    valorTotal: Number(pedido.valorTotal),
  }).catch((erro) => console.error('[WhatsApp] Erro inesperado:', erro));

  res.json(pedido);
});

// ---------- ADMIN: controle individual das marmitas (RN005) ----------
const statusUnidadeSchema = z.object({
  statusUnidade: z.nativeEnum(StatusUnidade),
});

router.patch('/:id/itens/:itemPedidoId', requireAdmin, async (req, res) => {
  const parsed = statusUnidadeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Status de unidade inválido' });
  }

  const item = await prisma.itemPedido.update({
    where: { id: req.params.itemPedidoId },
    data: { statusUnidade: parsed.data.statusUnidade },
    include: { itemCardapio: true },
  });

  res.json(item);
});

export default router;
