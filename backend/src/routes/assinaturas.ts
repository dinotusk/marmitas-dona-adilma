import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { requireAdmin, requireCliente, type ClienteAuthRequest } from '../middleware/auth';
import { criarPedido, PedidoError } from '../services/pedidoService';
import { proximaDataApos } from '../services/assinaturaScheduler';

const router = Router();

const itensSchema = z
  .array(z.object({ itemCardapioId: z.string().uuid(), quantidade: z.number().int().positive() }))
  .min(1);

// ---------- CLIENTE: criar assinatura (gera o 1º pedido na hora) ----------
const criarAssinaturaSchema = z.object({
  periodicidade: z.enum(['SEMANAL', 'QUINZENAL', 'MENSAL']),
  formaPagamento: z.enum(['PIX', 'CARTAO', 'DINHEIRO']),
  tipoEntrega: z.enum(['ENTREGA', 'RETIRADA']).default('ENTREGA'),
  itens: itensSchema,
});

router.post('/', requireCliente, async (req: ClienteAuthRequest, res) => {
  const parsed = criarAssinaturaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { periodicidade, formaPagamento, tipoEntrega, itens } = parsed.data;
  const clienteId = req.clienteId!;
  const proximoPedidoEm = proximaDataApos(new Date(), periodicidade);

  const assinatura = await prisma.assinatura.create({
    data: { clienteId, periodicidade, formaPagamento, tipoEntrega, itensPadrao: itens, proximoPedidoEm },
  });

  try {
    const pedido = await criarPedido({
      clienteId,
      formaPagamento,
      tipoEntrega,
      itens,
      assinaturaId: assinatura.id,
    });
    res.status(201).json({ assinatura, primeiroPedido: pedido });
  } catch (e) {
    // O 1º pedido falhou (ex.: sem estoque agora), mas a assinatura já existe
    // e vai tentar de novo sozinha na próxima renovação.
    if (e instanceof PedidoError) {
      return res.status(201).json({ assinatura, primeiroPedido: null, avisoPrimeiroPedido: e.message });
    }
    throw e;
  }
});

// ---------- CLIENTE: ver minhas assinaturas ----------
router.get('/minhas', requireCliente, async (req: ClienteAuthRequest, res) => {
  const assinaturas = await prisma.assinatura.findMany({
    where: { clienteId: req.clienteId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assinaturas);
});

// ---------- CLIENTE: pausar/retomar/cancelar/editar a própria assinatura ----------
const atualizarAssinaturaSchema = z.object({
  status: z.enum(['ATIVA', 'PAUSADA', 'CANCELADA']).optional(),
  periodicidade: z.enum(['SEMANAL', 'QUINZENAL', 'MENSAL']).optional(),
  itens: itensSchema.optional(),
});

router.patch('/:id', requireCliente, async (req: ClienteAuthRequest, res) => {
  const parsed = atualizarAssinaturaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const assinatura = await prisma.assinatura.findUnique({ where: { id: req.params.id } });
  if (!assinatura || assinatura.clienteId !== req.clienteId) {
    return res.status(404).json({ erro: 'Assinatura não encontrada' });
  }

  const atualizada = await prisma.assinatura.update({
    where: { id: assinatura.id },
    data: {
      status: parsed.data.status,
      periodicidade: parsed.data.periodicidade,
      itensPadrao: parsed.data.itens,
    },
  });

  res.json(atualizada);
});

// ---------- ADMIN: ver todas as assinaturas ----------
router.get('/', requireAdmin, async (_req, res) => {
  const assinaturas = await prisma.assinatura.findMany({
    include: { cliente: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(assinaturas);
});

export default router;
