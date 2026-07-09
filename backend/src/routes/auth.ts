import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prismaClient';
import { JWT_SECRET } from '../middleware/auth';

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

export default router;
