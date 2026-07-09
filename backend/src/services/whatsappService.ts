import { StatusPedido } from '@prisma/client';

// Serviço de notificação via WhatsApp usando um provedor não-oficial (ex: Z-API).
// A ideia é isolar o provedor aqui: se um dia você trocar pra API oficial da Meta
// ou outro provedor, só mexe neste arquivo — o resto do app não muda.

const ZAPI_INSTANCE_ID = process.env.ZAPI_INSTANCE_ID;
const ZAPI_TOKEN = process.env.ZAPI_TOKEN;
const ZAPI_CLIENT_TOKEN = process.env.ZAPI_CLIENT_TOKEN; // header de segurança da Z-API

const ZAPI_BASE_URL = ZAPI_INSTANCE_ID && ZAPI_TOKEN
  ? `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`
  : null;

// Mensagens por status do pedido (RN006). Fácil de editar sem mexer na lógica.
const MENSAGENS_POR_STATUS: Record<StatusPedido, (dados: DadosNotificacao) => string> = {
  RECEBIDO: (d) =>
    `Olá, ${d.nomeCliente}! 🍱 Recebemos seu pedido #${d.numeroPedido}. Total: R$ ${d.valorTotal.toFixed(2)}. Em breve começamos o preparo!`,
  EM_PREPARACAO: (d) =>
    `Seu pedido #${d.numeroPedido} está sendo preparado com carinho! 👩‍🍳`,
  PRONTO: (d) =>
    `Boa notícia! Seu pedido #${d.numeroPedido} está pronto e logo sai para entrega. 🎉`,
  SAIU_ENTREGA: (d) =>
    `Seu pedido #${d.numeroPedido} saiu para entrega! 🛵 Fique atento.`,
  ENTREGUE: (d) =>
    `Pedido #${d.numeroPedido} entregue! Bom apetite 😋 Obrigado pela preferência.`,
};

interface DadosNotificacao {
  nomeCliente: string;
  telefone: string; // formato: DDI+DDD+numero, ex: 5561999999999
  numeroPedido: string;
  valorTotal: number;
}

function formatarTelefone(telefone: string): string {
  // Remove tudo que não é dígito e garante o prefixo do Brasil (55) se não vier
  const apenasNumeros = telefone.replace(/\D/g, '');
  return apenasNumeros.startsWith('55') ? apenasNumeros : `55${apenasNumeros}`;
}

export async function notificarStatusPedido(
  status: StatusPedido,
  dados: DadosNotificacao
): Promise<{ enviado: boolean; motivo?: string }> {
  if (!ZAPI_BASE_URL) {
    console.warn('[WhatsApp] Credenciais Z-API não configuradas — notificação pulada.');
    return { enviado: false, motivo: 'credenciais_nao_configuradas' };
  }

  const mensagem = MENSAGENS_POR_STATUS[status](dados);
  const telefoneFormatado = formatarTelefone(dados.telefone);

  try {
    const resposta = await fetch(`${ZAPI_BASE_URL}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(ZAPI_CLIENT_TOKEN ? { 'Client-Token': ZAPI_CLIENT_TOKEN } : {}),
      },
      body: JSON.stringify({
        phone: telefoneFormatado,
        message: mensagem,
      }),
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      console.error('[WhatsApp] Falha ao enviar:', resposta.status, erro);
      return { enviado: false, motivo: `erro_provedor_${resposta.status}` };
    }

    return { enviado: true };
  } catch (erro) {
    // Notificação falhar NUNCA deve derrubar a atualização do pedido.
    // Por isso capturamos o erro aqui e apenas logamos.
    console.error('[WhatsApp] Erro de rede ao notificar:', erro);
    return { enviado: false, motivo: 'erro_rede' };
  }
}
