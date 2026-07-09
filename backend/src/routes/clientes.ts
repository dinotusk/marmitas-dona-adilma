import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../prismaClient';
import { JWT_SECRET, requireCliente, type ClienteAuthRequest } from '../middleware/auth';

const router = Router();

// Protege contra força bruta: 10 tentativas por IP a cada 15 minutos.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas. Tente novamente mais tarde.' },
});

function respostaCliente(cliente: { id: string; nome: string; telefone: string; endereco: string }) {
  return { id: cliente.id, nome: cliente.nome, telefone: cliente.telefone, endereco: cliente.endereco };
}

// ---------- Criar conta (ou "assumir" o histórico de pedidos feitos como convidado) ----------
const cadastroSchema = z.object({
  nome: z.string().min(1),
  telefone: z.string().min(8),
  endereco: z.string().min(1),
  senha: z.string().min(6),
});

router.post('/cadastro', authLimiter, async (req, res) => {
  const parsed = cadastroSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: parsed.error.flatten() });
  }

  const { nome, telefone, endereco, senha } = parsed.data;

  const existente = await prisma.cliente.findUnique({ where: { telefone } });
  if (existente?.senhaHash) {
    return res.status(409).json({ erro: 'Esse telefone já tem uma conta. Faça login.' });
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  // Se a pessoa já tinha pedido como convidado com esse telefone, a conta nova
  // assume o cadastro existente (e o histórico de pedidos junto, já que Pedido
  // é vinculado por clienteId).
  const cliente = await prisma.cliente.upsert({
    where: { telefone },
    update: { nome, endereco, senhaHash },
    create: { nome, telefone, endereco, senhaHash },
  });

  const token = jwt.sign({ clienteId: cliente.id }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, cliente: respostaCliente(cliente) });
});

// ---------- Login ----------
const loginSchema = z.object({
  telefone: z.string().min(8),
  senha: z.string().min(1),
});

router.post('/login', authLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ erro: 'Dados inválidos' });
  }

  const { telefone, senha } = parsed.data;
  const cliente = await prisma.cliente.findUnique({ where: { telefone } });
  if (!cliente || !cliente.senhaHash) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const senhaValida = await bcrypt.compare(senha, cliente.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ clienteId: cliente.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, cliente: respostaCliente(cliente) });
});

// ---------- Dados da conta logada ----------
router.get('/me', requireCliente, async (req: ClienteAuthRequest, res) => {
  const cliente = await prisma.cliente.findUnique({ where: { id: req.clienteId } });
  if (!cliente) {
    return res.status(404).json({ erro: 'Cliente não encontrado' });
  }
  res.json(respostaCliente(cliente));
});

// ---------- Histórico de pedidos da conta logada ----------
router.get('/meus-pedidos', requireCliente, async (req: ClienteAuthRequest, res) => {
  const pedidos = await prisma.pedido.findMany({
    where: { clienteId: req.clienteId },
    include: { itens: { include: { itemCardapio: true } }, cliente: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(pedidos);
});

export default router;
