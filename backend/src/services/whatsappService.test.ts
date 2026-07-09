import { describe, it, expect } from 'vitest';
import { formatarTelefone } from './whatsappService';

describe('formatarTelefone', () => {
  it('adiciona o prefixo 55 quando o número não tem', () => {
    expect(formatarTelefone('11999998888')).toBe('5511999998888');
  });

  it('não duplica o prefixo 55 quando já vem no número', () => {
    expect(formatarTelefone('5511999998888')).toBe('5511999998888');
  });

  it('remove caracteres não numéricos antes de formatar', () => {
    expect(formatarTelefone('(11) 99999-8888')).toBe('5511999998888');
  });
});
