# TODO — Sistema de Aulas ao Vivo, Cursos Pagos, Convites e Promoções

**Data/Hora:** 2026-05-13
**Sessão:** live-classes-commerce-v1
**Status Geral:** ✅ CONCLUÍDO

## 🎯 OBJETIVO PRINCIPAL
Plataforma comercial completa: produtos vendáveis (Stripe BRL + moedas), turmas/cohorts com capacidade, aulas ao vivo com link assinado/abstraído (LiveKit no roadmap), calendário FullCalendar (dia/mês/ano), catálogo, campanhas promocionais (Udemy-like), convites com vagas limitadas + cupons de desconto unificados, notificações in-app + email.

## 📋 CHECKLIST

### 🗄️ MIGRATIONS (database/migrations/)
- [x] 019-commerce-products.sql
- [x] 020-cohorts.sql
- [x] 021-live-classes.sql
- [x] 022-enrollments.sql
- [x] 023-campaigns.sql
- [x] 024-invites-extension.sql (estende vouchers)
- [x] 025-orders-stripe.sql
- [x] 026-notifications.sql

### 🏗️ BACKEND
- [x] modules/commerce (products, orders, campaigns, stripe, checkout, catalog)
- [x] modules/cohorts (turmas)
- [x] modules/live-classes (CRUD + join token assinado)
- [x] modules/enrollments (acesso, expiração, quota)
- [x] modules/invites (estende vouchers: scoped + discount unificado)
- [x] modules/notifications (in-app + email + scheduler)
- [x] modules/calendar (agregador)
- [x] app.module.ts — registrar 7 módulos
- [x] package.json: stripe, nodemailer (lazy require)
- [x] .env.example: STRIPE_*, SMTP_*, LIVEKIT_*, LIVE_CLASS_JWT_SECRET, FRONTEND_URL

### 🎨 FRONTEND — Services / Store
- [x] services: calendar, commerce, live-class, invite, notification
- [x] store: notifications.js (polling 60s)
- [x] package.json: @fullcalendar/vue3 + plugins + @stripe/stripe-js

### 🎨 FRONTEND — Views Aluno
- [x] Calendar.vue (FullCalendar dia/mês/ano + cadeado)
- [x] LiveClassRoom.vue (estados before/live/recording/after, janela ±15/30min)
- [x] CourseCatalog.vue
- [x] ProductDetail.vue (escolha de turma)
- [x] CourseCheckout.vue (Stripe Elements + slider moedas)
- [x] InviteRedeem.vue (/invite/:code)
- [x] MyEnrollments.vue
- [x] CampaignLanding.vue (/promo/:slug)

### 🎨 FRONTEND — Views Admin
- [x] AdminCalendarView.vue
- [x] AdminProductsView.vue
- [x] AdminCohortsView.vue
- [x] AdminCampaignsView.vue
- [x] AdminInvitesView.vue

### 🎨 FRONTEND — Components
- [x] PriceTag.vue, ProductCard.vue, CoinsSlider.vue, PromoBadge.vue
- [x] NotificationBell.vue, LockedEventModal.vue

### 🔗 Router
- [x] /calendar, /live/:id, /catalog, /product/:slug, /checkout/:productId, /invite/:code, /promo/:slug, /me/enrollments
- [x] admin children: calendario, produtos, turmas, campanhas, convites

### 📚 DOCS
- [x] docs/LIVEKIT-INTEGRATION.md (roadmap)
- [x] docs/STRIPE-SETUP.md
- [x] docs/COMMERCE-PRICING.md (regra: cupom OU campanha, o maior; nunca acumula)

### 🧪 VALIDAÇÃO
- [x] Backend builda (`npm run build` em backend/ — OK)
- [x] Frontend builda (`npm run build` em frontend/ — OK, apenas warning de chunk size)
- [ ] Smoke test fluxos principais (manual, depende de DB rodando + chaves Stripe)

## 📝 NOTAS FINAIS / FOLLOW-UPS

- **Stripe/SMTP em modo dev**: sem `STRIPE_SECRET_KEY`/`SMTP_HOST`, o sistema
  funciona apenas para produtos gratuitos ou 100% pagos em moedas, e
  notificações ficam só in-app. Documentado em `docs/STRIPE-SETUP.md`.
- **LiveKit**: SDK não instalado ainda; o `provider='livekit'` está aceito
  mas hoje retorna URL com JWT interno. Para ativar, seguir
  `docs/LIVEKIT-INTEGRATION.md`.
- **Menu admin**: rotas funcionais por URL direta (`/admin/calendario`,
  `/admin/produtos`, `/admin/turmas`, `/admin/campanhas`, `/admin/convites`).
  Adicionar links no menu lateral do `Admin.vue` é opcional/cosmético.
- **Checkout legado**: rota `/checkout` (sem param) continua apontando para
  o `Checkout.vue` antigo (boas-vindas). A nova rota é `/checkout/:productId`.
- **Smoke test sugerido**:
  1. `cd backend && npm run start:dev`
  2. Aplicar migrations 019–026.
  3. Admin: criar produto + cohort + live class.
  4. Aluno: ver em `/calendar`, comprar em `/checkout/:productId` com cartão
     de teste `4242 4242 4242 4242`.
  5. Verificar enrollment em `/me/enrollments`.

## 🎉 CONCLUSÃO
- [x] **TODOS OS CHECKS DE IMPLEMENTAÇÃO CONCLUÍDOS**
- [x] **BUILDS BACKEND + FRONTEND VALIDADOS**
- [ ] **SMOKE TEST DE PRODUÇÃO** (requer DB + Stripe configurados — opcional)

---
**Última Atualização:** 2026-05-13 (final)
