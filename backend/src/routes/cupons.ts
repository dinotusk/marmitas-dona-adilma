import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ---------- ADMIN: criar cupom ----------
const criarCupomSchema = z.object({
  codigo: z.string().min(3).transform((v) => v.trim().toUpperCase()),
  tipo: z.enum(['PERCENTUAL', 'FIXO']),
  valor: z.number().positive(),
  validoAte: z.string().datetime().optional(),
  usosMaximos: z.number().int().positive().optional(),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = criarCupomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { codigo, tipo, valor, validoAte, usosMaximos } = parsed.data;

  const existente = await prisma.cupom.findUnique({ where: { codigo } });
  if (existente) {
    return res.status(409).json({ erro: 'Já existe um cupom com esse código' });
  }

  const cupom = await prisma.cupom.create({
    data: {
      codigo,
      tipo,
      valor,
      validoAte: validoAte ? new Date(validoAte) : undefined,
      usosMaximos,
    },
  });

  res.status(201).json(cupom);
});

// ---------- ADMIN: listar cupons ----------
router.get('/', requireAdmin, async (_req, res) => {
  const cupons = await prisma.cupom.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(cupons);
});

// ---------- ADMIN: ativar/desativar cupom ----------
const patchCupomSchema = z.object({
  ativo: z.boolean(),
});

router.patch('/:id', requireAdmin, async (req, res) => {
  const parsed = patchCupomSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  const cupom = await prisma.cupom.update({
    where: { id: req.params.id },
    data: { ativo: parsed.data.ativo },
  });

  res.json(cupom);
});

// ---------- PÚBLICO: validar cupom e ver o desconto antes de finalizar o pedido ----------
router.get('/validar/:codigo', async (req, res) => {
  const subtotal = Number(req.query.subtotal);
  if (!subtotal || subtotal <= 0) {
    return res.status(400).json({ erro: 'Informe o subtotal do carrinho para calcular o desconto' });
  }

  const cupom = await prisma.cupom.findUnique({ where: { codigo: req.params.codigo.trim().toUpperCase() } });

  if (!cupom || !cupom.ativo) {
    return res.status(404).json({ erro: 'Cupom inválido ou inativo' });
  }
  if (cupom.validoAte && cupom.validoAte < new Date()) {
    return res.status(400).json({ erro: 'Cupom expirado' });
  }
  if (cupom.usosMaximos && cupom.usosAtuais >= cupom.usosMaximos) {
    return res.status(400).json({ erro: 'Cupom esgotado' });
  }

  const valorDesconto =
    cupom.tipo === 'PERCENTUAL'
      ? Math.min(subtotal, (subtotal * Number(cupom.valor)) / 100)
      : Math.min(subtotal, Number(cupom.valor));

  res.json({ codigo: cupom.codigo, tipo: cupom.tipo, valor: Number(cupom.valor), valorDesconto });
});

export default router;
