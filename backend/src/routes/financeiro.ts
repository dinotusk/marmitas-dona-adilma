import { Router } from 'express';
import { prisma } from '../prismaClient';
import { requireAdmin } from '../middleware/auth';

const router = Router();

function inicioDoDia(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function inicioDaSemana(d: Date) {
  const x = inicioDoDia(d);
  const diaSemana = x.getDay();
  x.setDate(x.getDate() - diaSemana);
  return x;
}

function inicioDoMes(d: Date) {
  const x = inicioDoDia(d);
  x.setDate(1);
  return x;
}

// ---------- ADMIN: dashboard financeiro ----------
router.get('/dashboard', requireAdmin, async (_req, res) => {
  const agora = new Date();

  const [vendasDia, vendasSemana, vendasMes] = await Promise.all([
    prisma.pedido.aggregate({
      where: { createdAt: { gte: inicioDoDia(agora) }, statusPagamento: 'PAGO' },
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.pedido.aggregate({
      where: { createdAt: { gte: inicioDaSemana(agora) }, statusPagamento: 'PAGO' },
      _sum: { valorTotal: true },
      _count: true,
    }),
    prisma.pedido.aggregate({
      where: { createdAt: { gte: inicioDoMes(agora) }, statusPagamento: 'PAGO' },
      _sum: { valorTotal: true },
      _count: true,
    }),
  ]);

  res.json({
    vendasDia: { total: vendasDia._sum.valorTotal || 0, quantidade: vendasDia._count },
    vendasSemana: { total: vendasSemana._sum.valorTotal || 0, quantidade: vendasSemana._count },
    vendasMes: { total: vendasMes._sum.valorTotal || 0, quantidade: vendasMes._count },
  });
});

// ---------- ADMIN: relatório de vendas por período (RN009) ----------
router.get('/relatorios/vendas', requireAdmin, async (req, res) => {
  const { inicio, fim } = req.query as { inicio?: string; fim?: string };

  if (!inicio || !fim) {
    return res.status(400).json({ erro: 'Parâmetros "inicio" e "fim" são obrigatórios (ISO date)' });
  }

  const pedidos = await prisma.pedido.findMany({
    where: { createdAt: { gte: new Date(inicio), lte: new Date(fim) } },
    include: { cliente: true, itens: { include: { itemCardapio: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const totalVendido = pedidos.reduce((acc, p) => acc + Number(p.valorTotal), 0);

  res.json({ periodo: { inicio, fim }, totalPedidos: pedidos.length, totalVendido, pedidos });
});

// ---------- ADMIN: consolidado por forma de pagamento (RN010) ----------
router.get('/relatorios/por-pagamento', requireAdmin, async (req, res) => {
  const { inicio, fim } = req.query as { inicio?: string; fim?: string };

  const where = inicio && fim ? { createdAt: { gte: new Date(inicio), lte: new Date(fim) } } : {};

  const grupos = await prisma.pedido.groupBy({
    by: ['formaPagamento'],
    where,
    _sum: { valorTotal: true },
    _count: true,
  });

  res.json(
    grupos.map((g) => ({
      formaPagamento: g.formaPagamento,
      total: g._sum.valorTotal || 0,
      quantidade: g._count,
    }))
  );
});

// ---------- ADMIN: sabores mais vendidos ----------
router.get('/relatorios/sabores-mais-vendidos', requireAdmin, async (_req, res) => {
  const itens = await prisma.itemPedido.groupBy({
    by: ['itemCardapioId'],
    _sum: { quantidade: true },
    orderBy: { _sum: { quantidade: 'desc' } },
  });

  const detalhado = await Promise.all(
    itens.map(async (i) => {
      const itemCardapio = await prisma.itemCardapio.findUnique({ where: { id: i.itemCardapioId } });
      return { sabor: itemCardapio?.sabor, quantidadeVendida: i._sum.quantidade };
    })
  );

  res.json(detalhado);
});

// ---------- ADMIN: histórico de clientes (RN011) ----------
router.get('/clientes', requireAdmin, async (_req, res) => {
  const clientes = await prisma.cliente.findMany({
    include: { pedidos: { include: { itens: { include: { itemCardapio: true } } } } },
  });

  const historico = clientes.map((c) => ({
    nome: c.nome,
    telefone: c.telefone,
    quantidadePedidos: c.pedidos.length,
    valorTotalGasto: c.pedidos.reduce((acc, p) => acc + Number(p.valorTotal), 0),
    saboresPreferidos: c.pedidos
      .flatMap((p) => p.itens.map((i) => i.itemCardapio.sabor))
      .reduce((acc: Record<string, number>, sabor) => {
        acc[sabor] = (acc[sabor] || 0) + 1;
        return acc;
      }, {}),
  }));

  res.json(historico);
});

export default router;
