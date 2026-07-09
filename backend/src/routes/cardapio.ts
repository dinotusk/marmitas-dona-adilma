import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ---------- PÚBLICO: cliente visualiza cardápio ativo (HU001) ----------
router.get('/', async (_req, res) => {
  const cardapio = await prisma.cardapio.findFirst({
    where: { ativo: true },
    include: { itens: { where: { ativo: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (!cardapio) {
    return res.status(404).json({ erro: 'Nenhum cardápio ativo no momento' });
  }

  res.json(cardapio);
});

// ---------- ADMIN: criar cardápio semanal ----------
const criarCardapioSchema = z.object({
  semanaInicio: z.string().datetime(),
  semanaFim: z.string().datetime(),
  itens: z
    .array(
      z.object({
        sabor: z.string().min(1),
        descricao: z.string().optional(),
        preco: z.number().positive(),
        qtdDisponivel: z.number().int().nonnegative(),
      })
    )
    .min(1),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = criarCardapioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { semanaInicio, semanaFim, itens } = parsed.data;

  const cardapio = await prisma.cardapio.create({
    data: {
      semanaInicio: new Date(semanaInicio),
      semanaFim: new Date(semanaFim),
      itens: { create: itens },
    },
    include: { itens: true },
  });

  res.status(201).json(cardapio);
});

// ---------- ADMIN: adicionar item a um cardápio existente ----------
const criarItemSchema = z.object({
  sabor: z.string().min(1),
  descricao: z.string().optional(),
  preco: z.number().positive(),
  qtdDisponivel: z.number().int().nonnegative(),
});

router.post('/:cardapioId/itens', requireAdmin, async (req, res) => {
  const parsed = criarItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const cardapio = await prisma.cardapio.findUnique({ where: { id: req.params.cardapioId } });
  if (!cardapio) {
    return res.status(404).json({ erro: 'Cardápio não encontrado' });
  }

  const item = await prisma.itemCardapio.create({
    data: { ...parsed.data, cardapioId: req.params.cardapioId },
  });

  res.status(201).json(item);
});

// ---------- ADMIN: ativar/desativar item do cardápio ----------
const patchItemSchema = z.object({
  ativo: z.boolean().optional(),
  preco: z.number().positive().optional(),
  qtdDisponivel: z.number().int().nonnegative().optional(),
  descricao: z.string().optional(),
});

router.patch('/itens/:itemId', requireAdmin, async (req, res) => {
  const parsed = patchItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const item = await prisma.itemCardapio.update({
    where: { id: req.params.itemId },
    data: parsed.data,
  });

  res.json(item);
});

// ---------- ADMIN: ativar/desativar o cardápio inteiro (pausar a semana) ----------
const patchCardapioSchema = z.object({
  ativo: z.boolean(),
});

router.patch('/:cardapioId', requireAdmin, async (req, res) => {
  const parsed = patchCardapioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const cardapio = await prisma.cardapio.update({
    where: { id: req.params.cardapioId },
    data: { ativo: parsed.data.ativo },
    include: { itens: true },
  });

  res.json(cardapio);
});

// ---------- ADMIN: listar todos os cardápios (histórico) ----------
router.get('/todos', requireAdmin, async (_req, res) => {
  const cardapios = await prisma.cardapio.findMany({
    include: { itens: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(cardapios);
});

export default router;
