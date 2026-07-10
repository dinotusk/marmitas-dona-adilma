import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { ConfiguracaoNegocio } from '@/types/domain';

const FORMAS_PAGAMENTO = ['PIX', 'CARTAO', 'DINHEIRO'];

export function PaginaNegocioAdmin() {
  const [config, setConfig] = useState<ConfiguracaoNegocio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const [nomeNegocio, setNomeNegocio] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [pagamentosAceitos, setPagamentosAceitos] = useState<string[]>([]);
  const [notificarNovoPedido, setNotificarNovoPedido] = useState(true);
  const [resumoSemanalEmail, setResumoSemanalEmail] = useState(false);

  useEffect(() => {
    api
      .get<ConfiguracaoNegocio>('/configuracao', true)
      .then((c) => {
        setConfig(c);
        setNomeNegocio(c.nomeNegocio ?? '');
        setTelefone(c.telefone ?? '');
        setEndereco(c.endereco ?? '');
        setPagamentosAceitos(c.pagamentosAceitos ?? []);
        setNotificarNovoPedido(c.notificarNovoPedido);
        setResumoSemanalEmail(c.resumoSemanalEmail);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar a configuração'))
      .finally(() => setCarregando(false));
  }, []);

  function alternarPagamento(forma: string) {
    setPagamentosAceitos((atual) =>
      atual.includes(forma) ? atual.filter((f) => f !== forma) : [...atual, forma]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setSucesso(false);
    setSalvando(true);
    try {
      const atualizado = await api.put<ConfiguracaoNegocio>(
        '/configuracao',
        { nomeNegocio, telefone, endereco, pagamentosAceitos, notificarNovoPedido, resumoSemanalEmail },
        true
      );
      setConfig(atualizado);
      setSucesso(true);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar a configuração');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Negócio</h1>
      <p className="text-ink-soft mb-6">Dados exibidos aos clientes e preferências de notificação.</p>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {config && !carregando && (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit} className="grid gap-4">
            <Input id="nomeNegocio" label="Nome do negócio" value={nomeNegocio} onChange={(e) => setNomeNegocio(e.target.value)} required />
            <Input id="telefone" label="Telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            <Input id="endereco" label="Endereço" value={endereco} onChange={(e) => setEndereco(e.target.value)} />

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Formas de pagamento aceitas</p>
              <div className="flex flex-wrap gap-3">
                {FORMAS_PAGAMENTO.map((forma) => (
                  <label key={forma} className="flex items-center gap-1.5 text-sm text-ink-soft">
                    <input type="checkbox" checked={pagamentosAceitos.includes(forma)} onChange={() => alternarPagamento(forma)} />
                    {forma}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={notificarNovoPedido} onChange={(e) => setNotificarNovoPedido(e.target.checked)} />
              Notificar por WhatsApp a cada novo pedido
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={resumoSemanalEmail} onChange={(e) => setResumoSemanalEmail(e.target.checked)} />
              Receber resumo semanal por e-mail
            </label>

            {sucesso && <p className="rounded-lg bg-herb/10 px-3 py-2 text-sm text-herb-dark">Configuração salva.</p>}

            <Button type="submit" disabled={salvando} className="justify-self-start">
              {salvando ? 'Salvando...' : 'Salvar configuração'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
