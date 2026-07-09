# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Sistema de pedidos de marmitas congeladas (frozen meal ordering system), split into two independent
npm projects with no shared root config:

- `backend/` — REST API in Node.js + Express + TypeScript + Prisma (PostgreSQL)
- `frontend/` — React 19 + TypeScript + Vite + Tailwind v4 SPA, serving both the customer-facing
  and admin areas from one app

There is no root `package.json` — always `cd` into `backend/` or `frontend/` before running npm
commands.

## Commands

### Backend (`backend/`)
- `npm run dev` — start API with hot reload (tsx watch) on `http://localhost:3333`
- `npm run build` — compile TypeScript (`tsc`)
- `npm start` — run compiled build (`dist/server.js`)
- `npm run prisma:generate` — regenerate Prisma client after editing `prisma/schema.prisma`
- `npm run prisma:migrate` — create/apply a migration in dev (`prisma migrate dev`)
- `npm run prisma:studio` — open Prisma Studio GUI on the DB
- `npm run seed` — seed DB with an admin user + initial cardápio (`admin@marmitas.com` / `admin123`)

No test suite or lint script is currently configured in the backend.

### Frontend (`frontend/`)
- `npm run dev` — start Vite dev server on `http://localhost:5173`; `/api/*` is proxied to
  `http://localhost:3333` (see `vite.config.ts`) — the backend must be running for API-backed pages
  to work
- `npm run build` — typecheck (`tsc -b`) then production build
- `npm run lint` — run oxlint
- `npm run preview` — preview the production build

No test suite is currently configured in the frontend.

### First-time setup
Backend needs `backend/.env` (copy from `backend/.env.example`) with `DATABASE_URL`, `JWT_SECRET`,
and optionally the `ZAPI_*` WhatsApp keys, then `npx prisma migrate dev --name init` before `npm run seed`.

## Architecture

### Backend
- Entry point `backend/src/server.ts` wires Express, CORS, JSON body parsing, and mounts one router
  per domain under `/api`: `auth`, `cardapio`, `pedidos`, `producao`, `financeiro`
  (`backend/src/routes/*.ts`).
- Routes are split into two access tiers within the same file: public customer endpoints (e.g.
  `POST /api/pedidos`, `GET /api/cardapio`) and admin endpoints guarded by the `requireAdmin`
  middleware (`backend/src/middleware/auth.ts`), which expects `Authorization: Bearer <JWT>` and
  attaches `adminId` to the request.
- Prisma is the only data layer; a singleton client lives in `backend/src/prismaClient.ts` and the
  schema in `backend/prisma/schema.prisma` is the source of truth for domain entities: `Admin`,
  `Cliente`, `Cardapio` → `ItemCardapio`, `Pedido` → `ItemPedido`, with `StatusPedido` tracking the
  order lifecycle (`RECEBIDO → EM_PREPARACAO → PRONTO → SAIU_ENTREGA → ENTREGUE`) and a separate
  per-unit `StatusUnidade` (`PREPARANDO`/`PRONTA`) on `ItemPedido` for kitchen-floor tracking.
- Request validation uses `zod` schemas defined inline at the top of each route handler.
- Money fields (`preco`, `valorTotal`) are `Decimal` in Postgres; order totals are always
  recalculated server-side from `ItemCardapio` prices — client-submitted totals are never trusted.
- Creating/updating a pedido runs in a `prisma.$transaction` that also decrements
  `ItemCardapio.qtdDisponivel` (stock), so order creation and stock control are atomic.
- WhatsApp notifications (`backend/src/services/whatsappService.ts`) fire on order creation and on
  every status change, via the unofficial Z-API provider. Notification calls are fire-and-forget
  (`.catch(...)` logging only) — a failed WhatsApp send must never break the API response. If
  `ZAPI_*` env vars are unset, sends are skipped and logged, not errored.

### Frontend
- `src/App.tsx` defines all routing: `/` is the public cardápio page; everything under `/admin/*`
  (except `/admin/login`) is wrapped in `RotaProtegida` (route guard) + `AdminLayout`.
- `src/contexts/AuthContext` owns admin auth state, backed by a JWT kept in `localStorage`.
- `src/lib/api.ts` is the single fetch wrapper for all backend calls: it prefixes `/api`, attaches
  the admin bearer token when `auth: true` is passed, and normalizes backend error bodies into a
  thrown `ApiError`. Always go through this wrapper rather than calling `fetch` directly.
- `src/types/domain.ts` mirrors the backend's Prisma schema — keep it in sync manually when the
  Prisma schema changes, there is no codegen link between them.
- `src/components/ui/` holds the shared design-system primitives (Button, Card, Input, Spinner,
  StatusBadge); `src/components/layout/` holds `ClienteLayout`/`AdminLayout` shells.
- Design tokens live in `src/index.css` via Tailwind v4's `@theme`. Visual direction is a
  "kitchen order ticket / homemade marmita" theme: parchment + herb-green + burnt-orange palette,
  Fraunces (serif) + Work Sans (sans) + IBM Plex Mono (order numbers). The signature component is
  `.stamp-badge`, styled to look like a kitchen ticket stamp — reuse it for status displays rather
  than introducing new badge styles.
- Path alias `@` → `src/` is configured in both `vite.config.ts` and the TS configs.

### Current implementation state (per frontend README)
Routing, layout, auth, API client, and design system are in place; the customer cardápio page is
functional end-to-end. Admin pages for pedidos/cardápio/produção/financeiro are still placeholders
(`src/pages/admin/PaginasPlaceholder.tsx`), and the customer checkout flow (building/submitting an
order) is not yet implemented — these are the main open gaps if asked to continue the build-out.
