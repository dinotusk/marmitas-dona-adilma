import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { requireAdmin } from '../middleware/auth';

const router = Router();

async function obterOuCriarConfiguracao() {
  const existente = await prisma.configuracaoNegocio.findFirst();
  if (existente) return existente;
  return prisma.configuracaoNegocio.create({ data: {} });
}

// ---------- PÚBLICO: dados básicos do negócio (rodapé, horário de funcionamento) ----------
router.get('/publica', async (_req, res) => {
  const config = await obterOuCriarConfiguracao();
  res.json({
    nomeNegocio: config.nomeNegocio,
    telefone: config.telefone,
    endereco: config.endereco,
    horarios: config.horarios,
  });
});

// ---------- ADMIN: ver configuração completa ----------
router.get('/', requireAdmin, async (_req, res) => {
  const config = await obterOuCriarConfiguracao();
  res.json(config);
});

// ---------- ADMIN: atualizar configuração ----------
const atualizarConfiguracaoSchema = z.object({
  nomeNegocio: z.string().min(1).optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  horarios: z.record(z.any()).optional(),
  pagamentosAceitos: z.array(z.string()).optional(),
  notificarNovoPedido: z.boolean().optional(),
  resumoSemanalEmail: z.boolean().optional(),
});

router.put('/', requireAdmin, async (req, res) => {
  const parsed = atualizarConfiguracaoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const atual = await obterOuCriarConfiguracao();
  const config = await prisma.configuracaoNegocio.update({
    where: { id: atual.id },
    data: parsed.data,
  });

  res.json(config);
});

export default router;
