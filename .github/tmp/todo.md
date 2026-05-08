# TODO ✅ CONCLUÍDO — Refatoração completa do backend (PHP → NestJS)

**Status:** ✅ FINALIZADO

## Database
- [x] `database/schema.sql` (UUID, índices padrão, lessons/settings com timestamps)

## Backend (`backend/`)
- [x] PHP removido
- [x] `package.json`, `tsconfig.json`, `nest-cli.json`, `.env`, `.env.example`, `.gitignore`
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
