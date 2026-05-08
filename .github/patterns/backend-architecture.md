# Backend Architecture - Hell's December

**Data de Criação:** 29/10/2025  
**Stack Principal:** NestJS + Fastify + TypeScript + Node.js

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### Arquitetura em Camadas
- **Controllers** → Recebem requisições HTTP
- **Services** → Lógica de negócio
- **Repositories** → Acesso a dados
- **Gateways** → Comunicação externa (APIs, WebSocket)
- **DTOs** → Validação e transferência de dados
- **Middlewares** → Interceptação e processamento de requisições

### Separação de Responsabilidades
- Cada camada tem uma responsabilidade única e bem definida
- Controllers nunca acessam diretamente o banco de dados
- Services nunca lidam com detalhes de HTTP
- Repositories são a única camada que acessa o banco

---

## 📦 STACK TECNOLÓGICO OBRIGATÓRIO

### Core Framework
```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/common": "^10.x",
  "@nestjs/platform-fastify": "^10.x",
  "fastify": "^4.x",
  "typescript": "^5.x",
  "node": ">=18.x"
}
```

### Segurança
```json
{
  "argon2": "^0.31.x",        // Criptografia de senhas e emails
  "@nestjs/jwt": "^10.x",      // JWT tokens
  "@nestjs/passport": "^10.x", // Autenticação
  "passport-jwt": "^4.x",      // Estratégia JWT
  "@nestjs/throttler": "^5.x"  // Rate limiting
}
```

### Validação e Transformação
```json
{
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

### Database
```json
{
  "@nestjs/typeorm": "^10.x",
  "typeorm": "^0.3.x",
  "mysql2": "^3.x"
}
```

### Utilitários
```json
{
  "@nestjs/schedule": "^4.x",  // CronJobs
  "@nestjs/config": "^3.x"     // Variáveis de ambiente
}
```

---

## 📁 ESTRUTURA DE PASTAS OBRIGATÓRIA

```
backend/
├── src/
│   ├── main.ts                    # Entry point (porta 3003)
│   ├── app.module.ts              # Módulo raiz
│   │
│   ├── config/                    # Configurações
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── throttler.config.ts
│   │   └── app.config.ts
│   │
│   ├── common/                    # Compartilhado
│   │   ├── decorators/           # Custom decorators
│   │   ├── filters/              # Exception filters
│   │   ├── guards/               # Guards (auth, roles)
│   │   ├── interceptors/         # Interceptors
│   │   ├── pipes/                # Validation pipes
│   │   └── middlewares/          # Middlewares globais
│   │       └── auth.middleware.ts # ⚠️ ÚNICO middleware de auth
│   │
│   ├── core/                      # Core do sistema
│   │   ├── auth/                 # Autenticação centralizada
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   │
│   │   ├── security/             # Criptografia
│   │   │   ├── argon2.service.ts
│   │   │   └── hmac.service.ts
│   │   │
│   │   └── database/             # Database management
│   │       ├── migrations/
│   │       └── seeds/
│   │
│   ├── modules/                   # Módulos de features
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── players/              # Entidades do jogo
│   │   ├── npcs/
│   │   ├── buildings/
│   │   └── enemies/
│   │
│   ├── gateways/                  # WebSocket gateways
│   │   └── game.gateway.ts
│   │
│   ├── jobs/                      # CronJobs
│   │   ├── jobs.module.ts
│   │   └── tasks/
│   │       ├── cleanup.job.ts
│   │       └── backup.job.ts
│   │
│   └── shared/                    # Tipos e interfaces compartilhadas
│       ├── interfaces/
│       └── types/
│
├── test/                          # Testes E2E
├── .env.development
├── .env.production
├── nest-cli.json
├── tsconfig.json
└── package.json
```

---

## 🔐 SEGURANÇA - PADRÕES OBRIGATÓRIOS

### 1. Criptografia de Senhas (Argon2)

```typescript
// src/core/security/argon2.service.ts
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class Argon2Service {
  /**
   * Hash de senha usando Argon2id (recomendado)
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,  // 64 MB
      timeCost: 3,
      parallelism: 4
    });
  }

  /**
   * Verificar senha
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      return false;
    }
  }

  /**
   * Hash de email (para busca segura)
   */
  async hashEmail(email: string): Promise<string> {
    const normalizedEmail = email.toLowerCase().trim();
    return argon2.hash(normalizedEmail, {
      type: argon2.argon2id,
      memoryCost: 32768,  // Menos custoso para emails
      timeCost: 2,
      parallelism: 2
    });
  }
}
```

### 2. Autenticação JWT + HMAC

```typescript
// src/config/jwt.config.ts
import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '1h',
    algorithm: 'HS256',  // HMAC-SHA256
    issuer: 'hells-december-api',
    audience: 'hells-december-client'
  }
};
```

```typescript
// src/core/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly argon2Service: Argon2Service
  ) {}

  /**
   * Gerar token JWT com HMAC
   */
  async generateToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email: email,
      iat: Date.now()
    };

    // Gerar HMAC do payload
    const hmac = crypto
      .createHmac('sha256', process.env.HMAC_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    return this.jwtService.sign({ ...payload, hmac });
  }

  /**
   * Validar token e HMAC
   */
  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      const { hmac, ...payload } = decoded;

      // Verificar HMAC
      const expectedHmac = crypto
        .createHmac('sha256', process.env.HMAC_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (hmac !== expectedHmac) {
        throw new Error('Invalid HMAC');
      }

      return payload;
    } catch (error) {
      return null;
    }
  }
}
```

### 3. Middleware de Autenticação Centralizado

```typescript
// src/common/middlewares/auth.middleware.ts
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/core/auth/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = this.extractTokenFromHeader(req);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const payload = await this.authService.validateToken(token);

    if (!payload) {
      throw new UnauthorizedException('Token inválido');
    }

    // Anexar usuário à requisição
    req['user'] = payload;
    next();
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

**⚠️ APLICAÇÃO GLOBAL NO APP.MODULE:**

```typescript
// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  // ... imports
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        'auth/login',
        'auth/register',
        'health',
        '/'
      )
      .forRoutes('*');  // Aplica a todas as rotas exceto as excluídas
  }
}
```

---

## 🛡️ RATE LIMITING

```typescript
// src/config/throttler.config.ts
import { ThrottlerModuleOptions } from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  ttl: 60,      // Janela de tempo (segundos)
  limit: 100,   // Máximo de requisições por janela
  // Rate limits específicos por rota
  ignoreUserAgents: [
    /healthcheck/i,
  ]
};
```

```typescript
// Aplicação em rotas específicas
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @Throttle(5, 60)  // 5 tentativas por minuto
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
}
```

---

## 📝 DTOs - DATA TRANSFER OBJECTS

### Padrões Obrigatórios

```typescript
// src/modules/users/dto/create-user.dto.ts
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email inválido' })
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Senha deve conter maiúscula, minúscula, número e caractere especial' }
  )
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;
}
```

**Validação Global:**

```typescript
// src/main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Remove propriedades não definidas no DTO
      forbidNonWhitelisted: true,  // Lança erro se propriedades extras forem enviadas
      transform: true,        // Transforma automaticamente tipos
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  await app.listen(3003, '0.0.0.0');
}
```

---

## 🗄️ REPOSITORIES E GATEWAYS

### Repository Pattern

```typescript
// src/modules/users/users.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
```

### Gateway Pattern (APIs Externas)

```typescript
// src/gateways/payment.gateway.ts
import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PaymentGateway {
  constructor(private readonly httpService: HttpService) {}

  async processPayment(amount: number, userId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post('https://api.payment-provider.com/charge', {
          amount,
          userId,
          currency: 'BRL'
        })
      );
      
      return response.data;
    } catch (error) {
      throw new HttpException('Erro ao processar pagamento', 500);
    }
  }
}
```

---

## ⏰ CRONJOBS

```typescript
// src/jobs/tasks/cleanup.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CleanupJob {
  private readonly logger = new Logger(CleanupJob.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanupExpiredSessions() {
    this.logger.log('Iniciando limpeza de sessões expiradas');
    
    // Lógica de limpeza
    
    this.logger.log('Limpeza concluída');
  }

  @Cron('0 */6 * * *')  // A cada 6 horas
  async handleDatabaseOptimization() {
    this.logger.log('Otimizando banco de dados');
    // Lógica de otimização
  }
}
```

**Registro no módulo:**

```typescript
// src/jobs/jobs.module.ts
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CleanupJob } from './tasks/cleanup.job';
import { BackupJob } from './tasks/backup.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [CleanupJob, BackupJob]
})
export class JobsModule {}
```

---

## 🔄 MIGRATIONS

### Configuração TypeORM

```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  migrations: ['dist/core/database/migrations/*{.ts,.js}'],
  migrationsRun: true,  // Auto-run migrations
  synchronize: false,   // NUNCA usar em produção
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: 'Z'
};
```

### Criar Migration

```bash
npm run migration:generate -- -n CreateUsersTable
```

### Exemplo de Migration

```typescript
// src/core/database/migrations/1698000000000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1698000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            default: 'UUID()'
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true
          },
          {
            name: 'password_hash',
            type: 'varchar',
            length: '255'
          },
          {
            name: 'username',
            type: 'varchar',
            length: '50'
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          }
        ],
        indices: [
          {
            name: 'IDX_USERS_EMAIL',
            columnNames: ['email']
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

---

## 🚀 CONFIGURAÇÃO DO SERVIDOR (Porta 3003)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      bodyLimit: 10485760,  // 10MB
    })
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  });

  // Validation Pipe Global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  // Prefixo global
  app.setGlobalPrefix('api/v1');

  // Porta 3003
  await app.listen(3003, '0.0.0.0');
  
  console.log(`🚀 Backend rodando em: http://localhost:3003`);
  console.log(`📚 API disponível em: http://localhost:3003/api/v1`);
}

bootstrap();
```

---

## 🌍 VARIÁVEIS DE AMBIENTE

### .env.development

```env
# Server
NODE_ENV=development
PORT=3003

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=hells_december_dev

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h

# HMAC
HMAC_SECRET=your-super-secret-hmac-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### .env.production

```env
# Server
NODE_ENV=production
PORT=3003

# Database
DB_HOST=production-db-host
DB_PORT=3306
DB_USER=prod_user
DB_PASSWORD=strong-password-here
DB_NAME=hells_december_prod

# JWT (MUDAR EM PRODUÇÃO)
JWT_SECRET=production-jwt-secret-use-long-random-string
JWT_EXPIRES_IN=1h

# HMAC (MUDAR EM PRODUÇÃO)
HMAC_SECRET=production-hmac-secret-use-long-random-string

# CORS
CORS_ORIGIN=https://your-production-domain.com

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=50
```

---

## ✅ CHECKLIST DE DESENVOLVIMENTO

### Para cada novo módulo:
- [ ] Criar estrutura de pastas completa (controller, service, repository, dto, entity)
- [ ] Implementar DTOs com validação completa
- [ ] Criar testes unitários para service
- [ ] Criar testes E2E para controller
- [ ] Documentar endpoints no Swagger
- [ ] Aplicar rate limiting se necessário
- [ ] Verificar se precisa de autenticação (já é global)

### Para cada novo endpoint:
- [ ] Validar dados de entrada com DTO
- [ ] Implementar tratamento de erros
- [ ] Retornar status HTTP apropriado
- [ ] Adicionar logs quando necessário
- [ ] Testar localmente
- [ ] Verificar performance

### Antes de deploy:
- [ ] Rodar migrations
- [ ] Verificar variáveis de ambiente de produção
- [ ] Testar build (`npm run build`)
- [ ] Executar testes (`npm run test`)
- [ ] Verificar logs de erros
- [ ] Testar rate limiting

---

## 🚫 ANTI-PATTERNS A EVITAR

❌ **NUNCA:**
- Acessar banco de dados diretamente no controller
- Usar `synchronize: true` em produção
- Hardcodar secrets no código
- Ignorar validação de DTOs
- Criar múltiplos middlewares de autenticação
- Usar porta 3000 ou 3001 (reservadas)
- Retornar senhas ou dados sensíveis nas APIs
- Ignorar rate limiting em rotas públicas

✅ **SEMPRE:**
- Usar repositories para acesso a dados
- Validar entrada com DTOs
- Criptografar senhas com Argon2
- Usar JWT + HMAC para autenticação
- Aplicar rate limiting
- Usar migrations para mudanças no banco
- Seguir separação de camadas
- Documentar código complexo

---

## 📚 COMANDOS ÚTEIS

```bash
# Desenvolvimento
npm run start:dev

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm run test
npm run test:e2e
npm run test:cov

# Migrations
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert

# Linting
npm run lint
npm run format
```

---

**Última atualização:** 29/10/2025  
**Responsável:** Arquitetura Backend - Hell's December
