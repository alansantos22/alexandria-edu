# TODO - Tela de Perfil Público (Bento Box Steam-style)

**Data/Hora:** 2026-05-09  
**Sessão:** profile-public-view  
**Status Geral:** ✅ CONCLUÍDO

## 🎯 OBJETIVO PRINCIPAL
Criar a tela de perfil público `/u/:username` com layout Bento Box exibindo:
nível/XP, streak, cartas colecionáveis, medalhas, trilhas/módulos/aulas concluídos e estatísticas.
Somente usuários autenticados acessam. Próprio perfil exibe badge "Seu perfil" + botão "Editar perfil" (desabilitado por ora).

## Decisões Técnicas Registradas
- Acesso: **Autenticado** (JwtAuthGuard global já cobre)
- URL: `/u/:username` (ex: `/u/demo`)
- Trilhas/Módulos: criar do zero (`tracks`, `modules`, FK em `lessons`)
- Próprio perfil: badge "Seu perfil" + botão "Editar perfil" (disabled)

---

## 📋 CHECKLIST DETALHADO

### 🗄️ FASE 1 — Banco de Dados (migration 003)

- [ ] **Criar `database/migrations/003-profile-system.sql`**
  - Tabela `badges` (catálogo global de medalhas)
  - Tabela `user_badges` (pivot user ↔ badge)
  - Tabela `cards` (catálogo global de cartas colecionáveis)
  - Tabela `user_cards` (pivot user ↔ card + quantity)
  - Tabela `tracks` (trilhas de aprendizado)
  - Tabela `modules` (módulos dentro de trilhas)
  - `ALTER TABLE lessons ADD COLUMN module_id` (condicional via INFORMATION_SCHEMA)
  - Seed: 4 badges + 3 cartas + 1 trilha + 1 módulo de exemplo
  - Registrar migration em tabela `migrations` se existir (INSERT IGNORE)
  - Validação: padrão MySQL-safe, sem `ADD COLUMN IF NOT EXISTS`, sem prepared statements complexos

### ⚙️ FASE 2 — Backend (módulo profile)

- [ ] **Entidades TypeORM**
  - `backend/src/modules/profile/entities/badge.entity.ts`
  - `backend/src/modules/profile/entities/user-badge.entity.ts`
  - `backend/src/modules/profile/entities/card.entity.ts`
  - `backend/src/modules/profile/entities/user-card.entity.ts`
  - `backend/src/modules/profile/entities/track.entity.ts`
  - `backend/src/modules/profile/entities/module.entity.ts`
  - Atualizar `backend/src/modules/lessons/entities/lesson.entity.ts` — adicionar campo `moduleId` nullable

- [ ] **DTO de resposta**
  - `backend/src/modules/profile/dto/profile-response.dto.ts`

- [ ] **Repository**
  - `backend/src/modules/profile/profile.repository.ts`

- [ ] **Service**
  - `backend/src/modules/profile/profile.service.ts`
  - `getPublicProfile(username, requesterId)` — retorna perfil ou lança 404, flag `isOwnProfile`

- [ ] **Controller**
  - `backend/src/modules/profile/profile.controller.ts`
  - `GET /users/:username/profile` — usa `@CurrentUser()` decorator existente

- [ ] **Module + registrar no AppModule**
  - `backend/src/modules/profile/profile.module.ts`
  - `backend/src/app.module.ts` — importar ProfileModule

- [ ] **Build backend sem erros**
  - `npm run build` no diretório backend

### 🎨 FASE 3 — Frontend

- [ ] **Service de perfil**
  - `frontend/src/core/services/profile.service.js`

- [ ] **View container**
  - `frontend/src/views/Profile.vue`

- [ ] **Componentes (`frontend/src/components/profile/`)**
  - `ProfileHeader.vue` — avatar DiceBear + username + nível + barra XP + streak + moedas + badge/botão próprio perfil
  - `ShowcaseStats.vue` — aulas concluídas, taxa, streak, moedas
  - `ShowcaseBadges.vue` — grid medalhas + tooltip + empty state
  - `ShowcaseCards.vue` — cartas com CSS tilt/holografia + empty state
  - `ShowcaseTracks.vue` — trilhas → módulos → aulas + progresso + empty state

- [ ] **Estilos SCSS**
  - `frontend/src/assets/scss/components/_profile.scss`
  - `frontend/src/assets/scss/main.scss` — adicionar @use

- [ ] **Rota**
  - `frontend/src/router/index.js` — `/u/:username` lazy-loaded, requiresAuth

- [ ] **Build frontend sem erros**
  - `npm run build` no diretório frontend

### 🧪 FASE 4 — Validação Manual

- [ ] `/u/demo` logado como `demo` → badge "Seu perfil" + botão "Editar perfil"
- [ ] `/u/demo` logado como outro usuário → sem badge
- [ ] `/u/naoexiste` → 404 amigável
- [ ] Layout em 375px / 768px / 1280px
- [ ] Empty states (sem badges, sem cartas)
- [ ] 1 única requisição HTTP (Network tab)

---

## 🔗 ARQUIVOS QUE SERÃO MODIFICADOS

### Criados
- `database/migrations/003-profile-system.sql`
- `backend/src/modules/profile/` (6 entidades + repository + service + controller + module + dto)
- `frontend/src/views/Profile.vue`
- `frontend/src/components/profile/` (5 componentes)
- `frontend/src/core/services/profile.service.js`
- `frontend/src/assets/scss/components/_profile.scss`

### Modificados
- `backend/src/app.module.ts`
- `backend/src/modules/lessons/entities/lesson.entity.ts`
- `frontend/src/router/index.js`
- `frontend/src/assets/scss/main.scss`

## 🚨 CRITÉRIOS DE BLOQUEIO
- [ ] Build backend sem erros TypeScript
- [ ] Build frontend sem erros de compilação
- [ ] Nenhum import de CityView / WorldView / Three.js tocado

## 🎉 CONCLUSÃO
- [ ] TODOS OS CHECKS CONCLUÍDOS ✅
- [ ] VALIDAÇÃO FINAL REALIZADA ✅
- [ ] DEMANDA COMPLETAMENTE FINALIZADA ✅

---
**Status de Progresso:** 0/4 fases  
**Última Atualização:** 2026-05-09
- [x] `src/config/` — app, database, jwt, throttler
- [x] `src/core/security/` — Argon2Service, HmacService, SecurityModule
- [x] `src/core/auth/` — AuthModule, Controller, Service, DTOs, JwtPayload
- [x] `src/common/` — AuthMiddleware, RolesGuard, ActiveUserGuard, decorators, HttpExceptionFilter, HealthController
- [x] `src/modules/users/` — entity + repository + service
- [x] `src/modules/lessons/` — entity + repository + service + controller + DTOs
- [x] `src/modules/settings/` — entity + repository + service + controller + DTO
- [x] `src/app.module.ts` + `src/main.ts`
- [x] `npm install` (652 pacotes)
- [x] `npm run build` ✓

## Frontend
- [x] `src/core/api.js` (axios + Bearer + redirect 401)
- [x] `main.js` limpo
- [x] `vite.config.js` com alias `@`
- [x] `.env` com `VITE_API_BASE_URL`
- [x] Login, Register, Home, LessonPlayer, Admin atualizados
- [x] `router/index.js` (token + isActive)

## Docs
- [x] `README.md` com nova stack e endpoints
