import type { StatusPedido, StatusUnidade, StatusPagamento } from '@/types/domain';

// Elemento de assinatura da UI: pills de status com fundo tintado e texto
// mono, sem borda ou textura — reforça a hierarquia sem pesar a interface.

export const LABELS_PEDIDO: Record<StatusPedido, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARACAO: 'Em preparação',
  PRONTO: 'Pronto',
  SAIU_ENTREGA: 'Saiu p/ entrega',
  ENTREGUE: 'Entregue',
};

const CORES_PEDIDO: Record<StatusPedido, string> = {
  RECEBIDO: 'bg-ink-soft/10 text-ink-soft',
  EM_PREPARACAO: 'bg-paprika/10 text-paprika-dark',
  PRONTO: 'bg-herb/10 text-herb-dark',
  SAIU_ENTREGA: 'bg-herb/10 text-herb-dark',
  ENTREGUE: 'bg-herb text-cream-card',
};

const LABELS_UNIDADE: Record<StatusUnidade, string> = {
  PREPARANDO: 'Preparando',
  PRONTA: 'Pronta',
};

export const LABELS_PAGAMENTO: Record<StatusPagamento, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
};

const CORES_PAGAMENTO: Record<StatusPagamento, string> = {
  PENDENTE: 'bg-paprika/10 text-paprika-dark',
  PAGO: 'bg-herb/10 text-herb-dark',
  CANCELADO: 'bg-ink-soft/10 text-ink-soft',
};

const TILT_PEDIDO: Record<StatusPedido, string> = {
  RECEBIDO: 'stamp-badge--tilt-b',
  EM_PREPARACAO: 'stamp-badge--tilt-a',
  PRONTO: 'stamp-badge--tilt-c',
  SAIU_ENTREGA: 'stamp-badge--tilt-a',
  ENTREGUE: 'stamp-badge--tilt-b',
};

export function StatusPedidoBadge({ status }: { status: StatusPedido }) {
  return (
    <span className={`stamp-badge ${TILT_PEDIDO[status]} px-2.5 py-1 text-xs ${CORES_PEDIDO[status]}`}>
      {LABELS_PEDIDO[status]}
    </span>
  );
}

export function StatusUnidadeBadge({ status }: { status: StatusUnidade }) {
  return (
    <span
      className={`stamp-badge px-2 py-0.5 text-[11px] ${
        status === 'PRONTA' ? 'bg-herb/10 text-herb-dark' : 'bg-ink-soft/10 text-ink-soft'
      }`}
    >
      {LABELS_UNIDADE[status]}
    </span>
  );
}

export function StatusPagamentoBadge({ status }: { status: StatusPagamento }) {
  return (
    <span className={`stamp-badge stamp-badge--tilt-b px-2.5 py-1 text-xs ${CORES_PAGAMENTO[status]}`}>
      {LABELS_PAGAMENTO[status]}
    </span>
  );
}
