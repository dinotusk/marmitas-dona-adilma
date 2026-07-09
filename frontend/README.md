# Frontend - App de Marmitas

React + TypeScript + Vite + Tailwind v4, com roteamento para as duas áreas do produto
(cliente e admin) compartilhando a mesma base.

## Setup

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. As chamadas para `/api/*` são redirecionadas via proxy
(configurado em `vite.config.ts`) para o backend em `http://localhost:3333` — garanta que
o backend esteja rodando (`npm run dev` na pasta `backend/`).

## Estrutura

```
src/
  types/domain.ts       # tipos espelhando o schema Prisma do backend
  lib/api.ts            # cliente HTTP tipado (fetch wrapper + tratamento de erro)
  contexts/AuthContext  # autenticação do admin (JWT em localStorage)
  components/ui/        # Button, Card, Input, Spinner, StatusBadge (design system)
  components/layout/    # ClienteLayout, AdminLayout
  components/RotaProtegida.tsx  # guarda de rota pra área admin
  pages/cliente/        # páginas da área do cliente
  pages/admin/          # páginas da área admin
```

## Design tokens

Definidos em `src/index.css` via `@theme` (Tailwind v4). Direção visual: comanda de
cozinha / marmita caseira — paleta parchment + verde-erva + laranja queimado, tipografia
serifada (Fraunces) + sans (Work Sans) + mono (IBM Plex Mono) para números de pedido.
O elemento de assinatura é o `.stamp-badge`, usado nos badges de status (parece carimbo
de tíquete de cozinha).

## Login de admin (dev)

Use as credenciais criadas pelo seed do backend: `admin@marmitas.com` / `admin123`.

## Status atual

- Roteamento, layout, autenticação, cliente de API e design system prontos
- Página de cardápio do cliente funcional (consome a API real)
- Login do admin funcional
- Demais páginas admin (pedidos, cardápio, produção, financeiro) são placeholders —
  próxima etapa é detalhar cada uma
- Fluxo de checkout do cliente (escolher itens, montar pedido) ainda não implementado
