import { describe, it, expect } from 'vitest';
import { criarPedidoSchema } from './pedidos';

function payloadValido(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    nome: 'Maria Teste',
    telefone: '11999998888',
    endereco: 'Rua das Marmitas, 123',
    formaPagamento: 'PIX',
    itens: [{ itemCardapioId: '11111111-1111-1111-1111-111111111111', quantidade: 2 }],
    ...overrides,
  };
}

describe('criarPedidoSchema', () => {
  it('aceita um payload válido', () => {
    expect(criarPedidoSchema.safeParse(payloadValido()).success).toBe(true);
  });

  it('rejeita pedido sem itens', () => {
    const resultado = criarPedidoSchema.safeParse(payloadValido({ itens: [] }));
    expect(resultado.success).toBe(false);
  });

  it('rejeita quantidade zero ou negativa', () => {
    const resultado = criarPedidoSchema.safeParse(
      payloadValido({ itens: [{ itemCardapioId: '11111111-1111-1111-1111-111111111111', quantidade: 0 }] })
    );
    expect(resultado.success).toBe(false);
  });

  it('rejeita telefone muito curto', () => {
    const resultado = criarPedidoSchema.safeParse(payloadValido({ telefone: '123' }));
    expect(resultado.success).toBe(false);
  });

  it('rejeita forma de pagamento inválida', () => {
    const resultado = criarPedidoSchema.safeParse(payloadValido({ formaPagamento: 'BOLETO' }));
    expect(resultado.success).toBe(false);
  });

  it('rejeita itemCardapioId que não é um uuid', () => {
    const resultado = criarPedidoSchema.safeParse(
      payloadValido({ itens: [{ itemCardapioId: 'nao-e-um-uuid', quantidade: 1 }] })
    );
    expect(resultado.success).toBe(false);
  });

  it('aceita observações opcionais ausentes', () => {
    const resultado = criarPedidoSchema.safeParse(payloadValido());
    expect(resultado.success && resultado.data.observacoes).toBeUndefined();
  });
});
