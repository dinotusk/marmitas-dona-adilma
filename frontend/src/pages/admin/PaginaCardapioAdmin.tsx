import { useEffect, useState, type FormEvent } from 'react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { api, ApiError } from '@/lib/api';
import type { Cardapio, ItemCardapio } from '@/types/domain';

interface NovoItem {
  sabor: string;
  descricao: string;
  preco: string;
  qtdDisponivel: string;
}

function novoItemVazio(): NovoItem {
  return { sabor: '', descricao: '', preco: '', qtdDisponivel: '' };
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function ItemCardapioRow({
  item,
  onSalvo,
}: {
  item: ItemCardapio;
  onSalvo: (atualizado: ItemCardapio) => void;
}) {
  const [descricao, setDescricao] = useState(item.descricao ?? '');
  const [preco, setPreco] = useState(item.preco);
  const [qtdDisponivel, setQtdDisponivel] = useState(String(item.qtdDisponivel));
  const [ativo, setAtivo] = useState(item.ativo);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setErro(null);
    setSalvando(true);
    try {
      const atualizado = await api.patch<ItemCardapio>(
        `/cardapio/itens/${item.id}`,
        {
          descricao: descricao.trim() || undefined,
          preco: Number(preco),
          qtdDisponivel: Number(qtdDisponivel),
          ativo,
        },
        true
      );
      onSalvo(atualizado);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar o item');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="py-3 border-b border-line last:border-0">
      <p className="font-medium text-ink">{item.sabor}</p>
      <input
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Descrição"
        className="mt-1 w-full px-2 py-1 text-sm rounded border border-line bg-cream-card text-ink-soft
          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
      />
      <div className="flex flex-wrap items-center gap-3 mt-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-24 px-2 py-1.5 rounded border border-line bg-cream-card text-ink text-sm
            focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
        />
        <input
          type="number"
          min="0"
          value={qtdDisponivel}
          onChange={(e) => setQtdDisponivel(e.target.value)}
          className="w-20 px-2 py-1.5 rounded border border-line bg-cream-card text-ink text-sm
            focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
        />
        <label className="flex items-center gap-1.5 text-sm text-ink-soft">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo
        </label>
        <Button variant="ghost" onClick={salvar} disabled={salvando} className="text-xs py-1.5 px-3">
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
        {erro && <span className="text-xs text-paprika-dark">{erro}</span>}
      </div>
    </div>
  );
}

export function PaginaCardapioAdmin() {
  const [cardapios, setCardapios] = useState<Cardapio[]>([]);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [semanaInicio, setSemanaInicio] = useState('');
  const [semanaFim, setSemanaFim] = useState('');
  const [novosItens, setNovosItens] = useState<NovoItem[]>([novoItemVazio()]);
  const [criando, setCriando] = useState(false);
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);

  function carregarCardapios() {
    api
      .get<Cardapio[]>('/cardapio/todos', true)
      .then((lista) => {
        setCardapios(lista);
        setSelecionadoId((atual) => atual ?? lista[0]?.id ?? null);
      })
      .catch((e) => setErro(e instanceof ApiError ? e.message : 'Não foi possível carregar o cardápio'))
      .finally(() => setCarregando(false));
  }

  useEffect(() => {
    carregarCardapios();
  }, []);

  function atualizarItemLocal(cardapioId: string, item: ItemCardapio) {
    setCardapios((atual) =>
      atual.map((c) => (c.id === cardapioId ? { ...c, itens: c.itens.map((i) => (i.id === item.id ? item : i)) } : c))
    );
  }

  function atualizarCampoNovoItem(index: number, campo: keyof NovoItem, valor: string) {
    setNovosItens((atual) => atual.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  async function handleCriarCardapio(e: FormEvent) {
    e.preventDefault();
    setErroCriacao(null);
    setCriando(true);
    try {
      const cardapio = await api.post<Cardapio>(
        '/cardapio',
        {
          semanaInicio: new Date(semanaInicio).toISOString(),
          semanaFim: new Date(semanaFim).toISOString(),
          itens: novosItens.map((i) => ({
            sabor: i.sabor,
            descricao: i.descricao.trim() || undefined,
            preco: Number(i.preco),
            qtdDisponivel: Number(i.qtdDisponivel),
          })),
        },
        true
      );
      setCardapios((atual) => [cardapio, ...atual]);
      setSelecionadoId(cardapio.id);
      setSemanaInicio('');
      setSemanaFim('');
      setNovosItens([novoItemVazio()]);
    } catch (e) {
      setErroCriacao(e instanceof ApiError ? e.message : 'Não foi possível criar o cardápio');
    } finally {
      setCriando(false);
    }
  }

  const cardapioSelecionado = cardapios.find((c) => c.id === selecionadoId) ?? null;

  return (
    <div>
      <h1 className="font-display text-3xl text-ink mb-1">Cardápio</h1>
      <p className="text-ink-soft mb-6">Gerencie os itens do cardápio e publique novas semanas.</p>

      {carregando && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {erro && <Card className="border-paprika/40 mb-4"><p className="text-paprika-dark text-sm">{erro}</p></Card>}

      {!carregando && (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-lg text-ink">Itens do cardápio</h2>
              {cardapios.length > 0 && (
                <select
                  value={selecionadoId ?? ''}
                  onChange={(e) => setSelecionadoId(e.target.value)}
                  className="max-w-full px-3 py-1.5 rounded-md border border-line bg-cream-card text-ink text-sm
                    focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
                >
                  {cardapios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {formatarData(c.semanaInicio)} – {formatarData(c.semanaFim)}
                      {c.ativo ? '' : ' (inativo)'}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {!cardapioSelecionado && <p className="text-sm text-ink-soft">Nenhum cardápio cadastrado ainda.</p>}

            {cardapioSelecionado && (
              <div>
                {cardapioSelecionado.itens.map((item) => (
                  <ItemCardapioRow
                    key={item.id}
                    item={item}
                    onSalvo={(atualizado) => atualizarItemLocal(cardapioSelecionado.id, atualizado)}
                  />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-display text-lg text-ink mb-4">Criar novo cardápio semanal</h2>
            <form onSubmit={handleCriarCardapio} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="semanaInicio"
                  label="Início da semana"
                  type="date"
                  value={semanaInicio}
                  onChange={(e) => setSemanaInicio(e.target.value)}
                  required
                />
                <Input
                  id="semanaFim"
                  label="Fim da semana"
                  type="date"
                  value={semanaFim}
                  onChange={(e) => setSemanaFim(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-3">
                {novosItens.map((item, index) => (
                  <div key={index} className="flex flex-col gap-2 pb-3 border-b border-line last:border-0">
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={item.sabor}
                        onChange={(e) => atualizarCampoNovoItem(index, 'sabor', e.target.value)}
                        placeholder="Sabor"
                        required
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
                      />
                      <input
                        value={item.descricao}
                        onChange={(e) => atualizarCampoNovoItem(index, 'descricao', e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="flex-1 min-w-[140px] px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.preco}
                        onChange={(e) => atualizarCampoNovoItem(index, 'preco', e.target.value)}
                        placeholder="Preço"
                        required
                        className="w-24 px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
                      />
                      <input
                        type="number"
                        min="0"
                        value={item.qtdDisponivel}
                        onChange={(e) => atualizarCampoNovoItem(index, 'qtdDisponivel', e.target.value)}
                        placeholder="Estoque"
                        required
                        className="w-20 px-3 py-2 rounded-md border border-line bg-cream-card text-ink text-sm
                          focus:outline-none focus:ring-2 focus:ring-herb/40 focus:border-herb"
                      />
                      <button
                        type="button"
                        onClick={() => setNovosItens((atual) => atual.filter((_, i) => i !== index))}
                        disabled={novosItens.length === 1}
                        className="text-xs text-paprika-dark hover:underline disabled:opacity-40 disabled:cursor-not-allowed px-2 py-2"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setNovosItens((atual) => [...atual, novoItemVazio()])}
                  className="text-sm text-herb-dark hover:underline self-start"
                >
                  + Adicionar item
                </button>
              </div>

              {erroCriacao && <p className="text-sm text-paprika-dark">{erroCriacao}</p>}

              <Button type="submit" disabled={criando} className="self-start">
                {criando ? 'Publicando...' : 'Publicar cardápio'}
              </Button>
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
