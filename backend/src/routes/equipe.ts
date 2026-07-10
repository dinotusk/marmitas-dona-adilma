import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { JWT_SECRET, requireAdmin } from '../middleware/auth';

const router = Router();

// ---------- ADMIN: listar a equipe ----------
router.get('/', requireAdmin, async (_req, res) => {
  const admins = await prisma.admin.findMany({
    select: { id: true, nome: true, email: true, cargo: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(admins);
});

// ---------- ADMIN: listar convites pendentes ----------
router.get('/convites', requireAdmin, async (_req, res) => {
  const convites = await prisma.adminConvite.findMany({
    where: { aceitoEm: null },
    orderBy: { createdAt: 'desc' },
  });
  res.json(convites.map((c) => ({ ...c, token: undefined, linkConvite: `/equipe/convite/${c.token}` })));
});

// ---------- ADMIN: criar convite ----------
const criarConviteSchema = z.object({
  email: z.string().email(),
  cargo: z.enum(['DONA', 'COZINHA', 'ATENDIMENTO']).default('ATENDIMENTO'),
});

router.post('/convites', requireAdmin, async (req, res) => {
  const parsed = criarConviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { email, cargo } = parsed.data;

  const jaEAdmin = await prisma.admin.findUnique({ where: { email } });
  if (jaEAdmin) {
    return res.status(409).json({ erro: 'Esse e-mail já é da equipe' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  const expiraEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const convite = await prisma.adminConvite.create({
    data: { email, cargo, token, expiraEm },
  });

  // Sem serviço de e-mail configurado: a administradora copia o link e manda
  // manualmente (WhatsApp, e-mail etc.), igual já fazemos com as notificações.
  console.log(`[Equipe] Convite criado para ${email}: /equipe/convite/${token}`);

  res.status(201).json({ ...convite, linkConvite: `/equipe/convite/${token}` });
});

// ---------- ADMIN: cancelar convite pendente ----------
router.delete('/convites/:id', requireAdmin, async (req, res) => {
  await prisma.adminConvite.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ---------- PÚBLICO: consultar um convite pelo token ----------
router.get('/convites/:token', async (req, res) => {
  const convite = await prisma.adminConvite.findUnique({ where: { token: req.params.token } });
  if (!convite || convite.aceitoEm || convite.expiraEm < new Date()) {
    return res.status(404).json({ erro: 'Convite inválido ou expirado' });
  }
  res.json({ email: convite.email, cargo: convite.cargo });
});

// ---------- PÚBLICO: aceitar convite e criar a conta ----------
const aceitarConviteSchema = z.object({
  nome: z.string().min(1),
  senha: z.string().min(6),
});

router.post('/convites/:token/aceitar', async (req, res) => {
  const parsed = aceitarConviteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const convite = await prisma.adminConvite.findUnique({ where: { token: req.params.token } });
  if (!convite || convite.aceitoEm || convite.expiraEm < new Date()) {
    return res.status(404).json({ erro: 'Convite inválido ou expirado' });
  }

  const senhaHash = await bcrypt.hash(parsed.data.senha, 10);

  const admin = await prisma.$transaction(async (tx) => {
    const novoAdmin = await tx.admin.create({
      data: { nome: parsed.data.nome, email: convite.email, senhaHash, cargo: convite.cargo },
    });
    await tx.adminConvite.update({ where: { id: convite.id }, data: { aceitoEm: new Date() } });
    return novoAdmin;
  });

  const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '8h' });
  res.status(201).json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email, cargo: admin.cargo } });
});

export default router;
