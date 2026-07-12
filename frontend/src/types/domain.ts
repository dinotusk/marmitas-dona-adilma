// Tipos espelhando o schema Prisma do backend (prisma/schema.prisma).
// Manter em sincronia manualmente por enquanto; se o projeto crescer,
// vale considerar gerar isso automaticamente a partir do schema.

export type StatusPedido =
  | 'RECEBIDO'
  | 'EM_PREPARACAO'
  | 'PRONTO'
  | 'SAIU_ENTREGA'
  | 'ENTREGUE';

export type FormaPagamento = 'PIX' | 'CARTAO' | 'DINHEIRO';

export type StatusPagamento = 'PENDENTE' | 'PAGO' | 'CANCELADO';

export type StatusUnidade = 'PREPARANDO' | 'PRONTA';

export type TipoEntrega = 'ENTREGA' | 'RETIRADA';

export type TipoDesconto = 'PERCENTUAL' | 'FIXO';

export type Periodicidade = 'SEMANAL' | 'QUINZENAL' | 'MENSAL';

export type StatusAssinatura = 'ATIVA' | 'PAUSADA' | 'CANCELADA';

export interface ItemCardapio {
  id: string;
  cardapioId: string;
  sabor: string;
  descricao: string | null;
  preco: string; // Decimal do Prisma serializa como string em JSON
  qtdDisponivel: number;
  controlaEstoque: boolean;
  ativo: boolean;
  tags: string[];
}

export interface Cupom {
  id: string;
  codigo: string;
  tipo: TipoDesconto;
  valor: string;
  ativo: boolean;
  validoAte: string | null;
  usosMaximos: number | null;
  usosAtuais: number;
}

export interface Assinatura {
  id: string;
  clienteId: string;
  periodicidade: Periodicidade;
  status: StatusAssinatura;
  itensPadrao: { itemCardapioId: string; quantidade: number }[];
  formaPagamento: FormaPagamento;
  tipoEntrega: TipoEntrega;
  proximoPedidoEm: string;
  createdAt: string;
  cliente?: Cliente;
}

export interface ConfiguracaoNegocio {
  id: string;
  nomeNegocio: string;
  telefone: string;
  endereco: string;
  horarios: Record<string, unknown>;
  pagamentosAceitos: string[];
  notificarNovoPedido: boolean;
  resumoSemanalEmail: boolean;
}

export type CargoAdmin = 'DONA' | 'COZINHA' | 'ATENDIMENTO';

export interface MembroEquipe {
  id: string;
  nome: string;
  email: string;
  cargo: CargoAdmin;
  createdAt: string;
}

export interface ConviteEquipe {
  id: string;
  email: string;
  cargo: CargoAdmin;
  expiraEm: string;
  createdAt: string;
  linkConvite?: string;
}

export interface Cardapio {
  id: string;
  semanaInicio: string;
  semanaFim: string;
  ativo: boolean;
  itens: ItemCardapio[];
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  itemCardapioId: string;
  quantidade: number;
  statusUnidade: StatusUnidade;
  itemCardapio: ItemCardapio;
}

export interface Pedido {
  id: string;
  clienteId: string;
  status: StatusPedido;
  formaPagamento: FormaPagamento;
  statusPagamento: StatusPagamento;
  tipoEntrega: TipoEntrega;
  taxaEntrega: string;
  cupomId: string | null;
  valorDesconto: string;
  assinaturaId: string | null;
  valorTotal: string;
  observacoes: string | null;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  itens: ItemPedido[];
}

export interface FechamentoDia {
  data: string;
  totalPedidos: number;
  totalMarmitas: number;
  quantidadePorSabor: Record<string, number>;
  observacoesEspeciais: { pedidoId: string; cliente: string; observacao: string }[];
  marmitasProntas: number;
  marmitasPendentes: number;
}

export interface DashboardFinanceiro {
  // total vem como Decimal do Prisma (serializa como string) quando há vendas,
  // ou como número 0 quando não há — sempre envolver com Number() ao exibir.
  vendasDia: { total: number | string; quantidade: number };
  vendasSemana: { total: number | string; quantidade: number };
  vendasMes: { total: number | string; quantidade: number };
}
