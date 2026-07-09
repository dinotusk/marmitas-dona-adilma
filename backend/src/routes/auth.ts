import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { JWT_SECRET, requireAdmin, type AuthRequest } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(6),
});

// POST /api/auth/login - login da administradora
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { email, senha } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(senha, admin.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ adminId: admin.id }, JWT_SECRET, { expiresIn: '8h' });

  res.json({ token, admin: { id: admin.id, nome: admin.nome, email: admin.email } });
});

// GET /api/auth/me - dados do admin autenticado
router.get('/me', requireAdmin, async (req: AuthRequest, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
  if (!admin) {
    return res.status(404).json({ erro: 'Administradora não encontrada' });
  }
  res.json({ id: admin.id, nome: admin.nome, email: admin.email });
});

// PATCH /api/auth/senha - trocar a própria senha
const trocarSenhaSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: z.string().min(6),
});

router.patch('/senha', requireAdmin, async (req: AuthRequest, res) => {
  const parsed = trocarSenhaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const admin = await prisma.admin.findUnique({ where: { id: req.adminId } });
  if (!admin) {
    return res.status(404).json({ erro: 'Administradora não encontrada' });
  }

  const senhaValida = await bcrypt.compare(parsed.data.senhaAtual, admin.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Senha atual incorreta' });
  }

  const novaSenhaHash = await bcrypt.hash(parsed.data.novaSenha, 10);
  await prisma.admin.update({ where: { id: admin.id }, data: { senhaHash: novaSenhaHash } });

  res.json({ ok: true });
});

export default router;
