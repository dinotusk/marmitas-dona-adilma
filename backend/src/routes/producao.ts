import { Router } from 'express';
import { prisma } from '../prismaClient';
import { requireAdmin } from '../middleware/auth';

const router = Router();

// ---------- ADMIN: fechamento da produção do dia (RN007) ----------
// Consolida pedidos do dia para auxiliar o preparo: total de pedidos,
// total de marmitas, quantidade por sabor, observações especiais,
// marmitas prontas vs pendentes.
router.get('/fechamento-dia', requireAdmin, async (req, res) => {
  const dataParam = req.query.data as string | undefined;
  // "YYYY-MM-DD" sem horário é interpretado pelo JS como meia-noite UTC; anexar
  // um horário sem timezone força a interpretação como meia-noite local, que é
  // o que setHours() abaixo espera para calcular o início/fim do dia local.
  const dataBase = dataParam ? new Date(`${dataParam}T00:00:00`) : new Date();

  const inicioDia = new Date(dataBase);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataBase);
  fimDia.setHours(23, 59, 59, 999);

  const pedidos = await prisma.pedido.findMany({
    where: { createdAt: { gte: inicioDia, lte: fimDia } },
    include: { itens: { include: { itemCardapio: true } }, cliente: true },
  });

  const totalPedidos = pedidos.length;

  let totalMarmitas = 0;
  let marmitasProntas = 0;
  let marmitasPendentes = 0;
  const quantidadePorSabor: Record<string, number> = {};
  const observacoesEspeciais: { pedidoId: string; cliente: string; observacao: string }[] = [];

  for (const pedido of pedidos) {
    if (pedido.observacoes) {
      observacoesEspeciais.push({
        pedidoId: pedido.id,
        cliente: pedido.cliente.nome,
        observacao: pedido.observacoes,
      });
    }

    for (const item of pedido.itens) {
      totalMarmitas += item.quantidade;
      quantidadePorSabor[item.itemCardapio.sabor] =
        (quantidadePorSabor[item.itemCardapio.sabor] || 0) + item.quantidade;

      if (item.statusUnidade === 'PRONTA') {
        marmitasProntas += item.quantidade;
      } else {
        marmitasPendentes += item.quantidade;
      }
    }
  }

  res.json({
    data: inicioDia.toISOString().slice(0, 10),
    totalPedidos,
    totalMarmitas,
    quantidadePorSabor,
    observacoesEspeciais,
    marmitasProntas,
    marmitasPendentes,
  });
});

export default router;
