# Alexandria EDU — Mentorship Platform

Plataforma de mentoria com aulas em vídeo + sessão ao vivo, agora rodando em VPS.

## 🏗️ Stack

| Camada    | Tecnologia                                       |
| --------- | ------------------------------------------------ |
| Backend   | NestJS 10 + Fastify + TypeScript + TypeORM       |
| Database  | MySQL 8 (InnoDB / utf8mb4) com UUID              |
| Auth      | JWT (HS256) + HMAC-SHA256 + Argon2id             |
| Frontend  | Vue 3 + Vite + Vue Router 4 + Axios              |

## 📁 Estrutura

```
backend/    # NestJS API (porta 3003, prefixo /api/v1)
database/   # schema.sql
frontend/   # Vue 3 + Vite (porta 5173)
.github/    # patterns + tmp/todo.md
```

## 🚀 Setup

### 1. Database

```sh
mysql -u root -p < database/schema.sql
```

### 2. Backend

```sh
cd backend
cp .env.example .env   # edite credenciais e secrets
npm install
npm run start:dev      # http://localhost:3003/api/v1
```

Variáveis principais (`.env`):

```env
PORT=3003
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=alexandria_db
JWT_SECRET=...
HMAC_SECRET=...
CORS_ORIGIN=http://localhost:5173
```

### 3. Frontend

```sh
cd frontend
npm install
npm run dev            # http://localhost:5173
```

`.env`:

```env
VITE_API_BASE_URL=http://localhost:3003/api/v1
```

## 🔐 Endpoints

| Método | Rota                      | Auth         | Descrição                       |
| ------ | ------------------------- | ------------ | ------------------------------- |
| POST   | `/auth/register`          | Pública      | Cadastro de aluno (inativo)     |
| POST   | `/auth/login`             | Pública      | Retorna JWT                     |
| GET    | `/auth/me`                | Bearer       | Dados do usuário logado         |
| GET    | `/lessons`                | Bearer + ✅  | Lista aulas (publicadas)        |
| GET    | `/lessons/:id`            | Bearer + ✅  | Detalhe de aula                 |
| POST   | `/lessons`                | Admin        | Criar aula                      |
| PUT    | `/lessons/:id`            | Admin        | Atualizar aula                  |
| DELETE | `/lessons/:id`            | Admin        | Remover aula                    |
| GET    | `/settings/live-link`     | Pública      | URL da sessão ao vivo           |
| PUT    | `/settings/live-link`     | Admin        | Atualizar URL                   |
| GET    | `/health`                 | Pública      | Healthcheck                     |

✅ = exige `is_active = true` (ou role admin).

## 🛡️ Segurança

- **Senhas:** Argon2id (memoryCost 64MB, timeCost 3, parallelism 4)
- **JWT:** HS256 + HMAC-SHA256 do payload (defesa em profundidade)
- **Validação:** `class-validator` + `ValidationPipe` (whitelist + forbidNonWhitelisted)
- **Rate limit:** 100 req/min global; 5/min em login; 10/min em register
- **CORS:** restrito a `CORS_ORIGIN`
- **Middleware global:** valida Bearer em todas as rotas, exceto whitelist (login/register/health/live-link GET)

## 👤 Tornando um usuário admin / ativo

```sql
UPDATE users
SET role = 'admin', is_active = TRUE
WHERE email = 'admin@email.com';
```

## 📦 Scripts

### Backend
- `npm run start:dev` — watch mode
- `npm run build` — compila para `dist/`
- `npm run start:prod` — roda build
- `npm test` — testes unitários

### Frontend
- `npm run dev`
- `npm run build`
- `npm run preview`

## 📜 Padrões

Toda nova feature deve seguir os documentos em `.github/patterns/`:
- `backend-architecture.md`
- `database-architecture.md`
- `frontend-architecture.md`
- `testing-strategy.md`
