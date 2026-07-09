# Backend - Sistema de Pedidos de Marmitas Congeladas

API REST em Node.js + Express + TypeScript + Prisma (PostgreSQL).

## Setup

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie o arquivo de ambiente e configure sua conexão com o banco:
   ```bash
   cp .env.example .env
   ```
   Edite `DATABASE_URL` com as credenciais do seu Postgres (local, Railway, Supabase, Render etc.)

3. Rode as migrations (cria as tabelas no banco):
   ```bash
   npx prisma migrate dev --name init
   ```

4. Popule com dados de exemplo (cria admin + cardápio inicial):
   ```bash
   npm run seed
   ```
   Login de admin criado: `admin@marmitas.com` / senha `admin123` (troque depois).

5. Suba o servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```
   API disponível em `http://localhost:3333`

## Estrutura de rotas

### Públicas (cliente)
- `GET /api/cardapio` — cardápio ativo da semana
- `POST /api/pedidos` — criar pedido
- `GET /api/pedidos/:id` — acompanhar status do pedido

### Admin (requer header `Authorization: Bearer <token>`)
- `POST /api/auth/login` — login (retorna o token)
- `POST /api/cardapio` — criar cardápio semanal
- `PATCH /api/cardapio/itens/:itemId` — editar/ativar/desativar item
- `GET /api/pedidos` — painel de pedidos (filtro `?status=`)
- `PATCH /api/pedidos/:id/status` — atualizar status do pedido
- `PATCH /api/pedidos/:id/itens/:itemPedidoId` — controle unitário (marmita pronta/preparando)
- `GET /api/producao/fechamento-dia` — consolidado de produção do dia
- `GET /api/financeiro/dashboard` — vendas dia/semana/mês
- `GET /api/financeiro/relatorios/vendas?inicio=&fim=` — relatório por período
- `GET /api/financeiro/relatorios/por-pagamento` — consolidado por forma de pagamento
- `GET /api/financeiro/relatorios/sabores-mais-vendidos`
- `GET /api/financeiro/clientes` — histórico de clientes

## Notificação via WhatsApp (Z-API)

O sistema notifica o cliente automaticamente a cada mudança de status (RN006), usando o
provedor não-oficial [Z-API](https://www.z-api.io):

1. Crie uma conta e uma instância na Z-API
2. Conecte seu WhatsApp escaneando o QR Code no painel deles
3. Copie `Instance ID`, `Token` e `Client-Token` para o `.env`
4. Pronto — toda vez que um pedido é criado ou tem o status atualizado
   (`POST /api/pedidos` e `PATCH /api/pedidos/:id/status`), uma mensagem é
   disparada automaticamente

As mensagens de cada status ficam em `src/services/whatsappService.ts`, fáceis de editar.
Se as variáveis não estiverem configuradas, o envio é apenas pulado (logado no console),
sem quebrar o funcionamento do resto da API.

⚠️ Importante: Z-API é um provedor não-oficial (conecta via QR Code do seu WhatsApp normal).
Isso é contra os termos de uso do WhatsApp e existe risco de banimento do número em uso mais
agressivo. É uma boa forma de validar o produto rápido; se o negócio crescer, vale considerar
migrar para a API oficial da Meta (Cloud API), que exige templates de mensagem pré-aprovados
mas elimina esse risco.

## Próximos passos
- Frontend cliente (React) consumindo as rotas públicas
- Painel admin (React) consumindo as rotas protegidas
- Integração de notificação (WhatsApp/push) no gancho marcado em `pedidos.ts` (`PATCH /:id/status`)
