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

// ---------- ADMIN: receita por semana (para gráfico) ----------
router.get('/receita-semanal', requireAdmin, async (req, res) => {
  const semanas = Math.min(52, Math.max(1, Number(req.query.semanas) || 8));
  const agora = new Date();
  const inicioJanela = inicioDaSemana(agora);
  inicioJanela.setDate(inicioJanela.getDate() - 7 * (semanas - 1));

  const pedidos = await prisma.pedido.findMany({
    where: { createdAt: { gte: inicioJanela }, statusPagamento: 'PAGO' },
    select: { createdAt: true, valorTotal: true },
  });

  const semanasArr = Array.from({ length: semanas }, (_, i) => {
    const semanaInicio = new Date(inicioJanela);
    semanaInicio.setDate(semanaInicio.getDate() + 7 * i);
    const semanaFim = new Date(semanaInicio);
    semanaFim.setDate(semanaFim.getDate() + 7);
    return { semanaInicio, semanaFim, total: 0, quantidade: 0 };
  });

  for (const pedido of pedidos) {
    const bucket = semanasArr.find((s) => pedido.createdAt >= s.semanaInicio && pedido.createdAt < s.semanaFim);
    if (!bucket) continue;
    bucket.total += Number(pedido.valorTotal);
    bucket.quantidade += 1;
  }

  res.json(
    semanasArr.map((s) => ({
      semanaInicio: s.semanaInicio.toISOString().slice(0, 10),
      total: s.total,
      quantidade: s.quantidade,
    }))
  );
});

// ---------- ADMIN: exportar pedidos em CSV ----------
function escapeCsv(valor: string) {
  if (/[",\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

router.get('/exportar', requireAdmin, async (req, res) => {
  const { inicio, fim } = req.query as { inicio?: string; fim?: string };

  const where = inicio && fim ? { createdAt: { gte: new Date(inicio), lte: new Date(fim) } } : {};

  const pedidos = await prisma.pedido.findMany({
    where,
    include: { cliente: true },
    orderBy: { createdAt: 'asc' },
  });

  const cabecalho = [
    'Data',
    'Cliente',
    'Telefone',
    'Status',
    'Status Pagamento',
    'Forma Pagamento',
    'Tipo Entrega',
    'Valor Total',
  ];

  const linhas = pedidos.map((p) =>
    [
      p.createdAt.toISOString(),
      p.cliente.nome,
      p.cliente.telefone,
      p.status,
      p.statusPagamento,
      p.formaPagamento,
      p.tipoEntrega,
      Number(p.valorTotal).toFixed(2),
    ]
      .map((v) => escapeCsv(String(v)))
      .join(',')
  );

  const csv = [cabecalho.join(','), ...linhas].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pedidos-${Date.now()}.csv"`);
  res.send('﻿' + csv);
});

// ---------- ADMIN: histórico de clientes (RN011) ----------
router.get('/clientes', requireAdmin, async (_req, res) => {
  const clientes = await prisma.cliente.findMany({
    include: { pedidos: { include: { itens: { include: { itemCardapio: true } } } } },
  });

  const historico = clientes.map((c) => ({
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    temConta: c.senhaHash !== null,
    quantidadePedidos: c.pedidos.length,
    pedidosCancelados: c.pedidos.filter((p) => p.statusPagamento === 'CANCELADO').length,
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
