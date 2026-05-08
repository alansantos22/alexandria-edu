# GitHub Copilot Instructions - Sistema de Desenvolvimento Especializado

## 🚨 FLUXO OBRIGATÓRIO - ANÁLISE PRÉVIA E APROVAÇÃO

**ANTES DE QUALQUER DESENVOLVIMENTO:**
1. 🔍 **ANÁLISE OBRIGATÓRIA** - Sempre analisar o que será feito
2. 📋 **APRESENTAÇÃO DO PLANO** - Explicar o que será mexido, onde, e se vai criar novos componentes
3. ❓ **PERGUNTAS ESCLARECEDORAS** - Durante a confirmação, fazer perguntas sobre pontos com dúvidas para evitar lacunas e garantir execução exata do que é desejado
4. 💡 **SISTEMA PROATIVO DE SUGESTÕES** - SEMPRE propor alternativas melhores e otimizações
5. ✅ **AGUARDAR APROVAÇÃO** - Não executar nada sem aprovação explícita do usuário
6. 🛑 **REGRA CRÍTICA** - SÓ PODE INICIAR ALTERAÇÕES APÓS APROVAÇÃO EXPLÍCITA (usuário dizer "SIM")

**⚠️ PROIBIDO:**
- Modificar arquivos antes da aprovação
- Criar novos arquivos antes da aprovação
- Executar comandos antes da aprovação
- Fazer qualquer alteração sem confirmação explícita

### ⚠️ REGRAS FUNDAMENTAIS ANTI-ALUCINAÇÃO

- **REUTILIZAR SEMPRE** - Buscar componentes existentes antes de criar novos
- **ARQUIVOS SEPARADOS** - .vue, .js, .scss (nunca arquivos gigantescos)
- **ESTRUTURA PADRÃO** - core, pages, components, shared
- **JUSTIFICATIVA** - Explicar por que está criando algo novo (se não existir alternativa)

---

## 💡 SISTEMA PROATIVO DE SUGESTÕES E MELHORIAS

### 🚀 PROPOSTA DE ALTERNATIVAS SUPERIORES (OBRIGATÓRIO)

**SEMPRE que o usuário solicitar algo, ANTES da implementação:**

#### 🎯 Análise da Solicitação:
1. **Identificar o Objetivo** - Entender o que o usuário realmente quer alcançar
2. **Contexto do Negócio** - Considerar o tipo de aplicação e público-alvo
3. **Limitações Atuais** - Avaliar possíveis problemas da solicitação original

#### 💎 Propostas de Melhoria (Mínimo 3-4 alternativas):
1. **Versão Otimizada** - Melhorar a ideia original mantendo a essência
2. **Alternativa Inovadora** - Propor abordagem diferente mas mais eficaz
3. **Versão Completa** - Expandir a funcionalidade para casos de uso maiores
4. **Adaptação ao Negócio** - Personalizar especificamente para o contexto

#### 📋 Exemplo Prático - Star Rating:

**Usuário solicita:** "Quero um star rating simples"

**Sistema deve responder:**
```
🔍 ANÁLISE: Você quer um sistema de avaliação por estrelas.

💡 PROPOSTAS DE MELHORIA:

1. ⭐ **Star Rating Otimizado**
   - Half-stars (0.5, 1.5, 2.5...)
   - Animações suaves
   - Feedback visual no hover
   - Acessibilidade (ARIA labels)

2. 🎯 **Rating Adaptativo**
   - Contexto: Para que tipo de item? (produto, serviço, conteúdo)
   - Critérios múltiplos (qualidade, preço, atendimento)
   - Escala personalizada (1-5, 1-10)

3. 🚀 **Sistema de Feedback Completo**
   - Star rating + comentários
   - Categorização de reviews
   - Moderação automática
   - Analytics de satisfação

4. 🎨 **Alternative Rating Systems**
   - Thumbs up/down (mais simples)
   - Emoji reactions (mais expressivo)
   - Scale rating (mais preciso)
   - NPS style (business-focused)

❓ QUAL DIREÇÃO PREFERE? Ou quer uma combinação?
```

#### 🔧 Templates de Sugestões por Área:

**🎨 UI/UX Components:**
- Versão acessível melhorada
- Mobile-first otimizada
- Design system consistente
- Micro-interactions aprimoradas

**⚙️ Funcionalidades Backend:**
- Performance otimizada
- Escalabilidade considerada
- Error handling robusto
- Cache strategies inteligentes

**🗄️ Estruturas de Dados:**
- Normalização otimizada
- Índices estratégicos
- Particionamento inteligente
- Backup/recovery considerado

**🚀 Integrações:**
- Rate limiting implementado
- Retry logic automático
- Circuit breaker patterns
- Monitoring integrado

#### 🎯 Critérios de Qualidade das Sugestões:

**OBRIGATÓRIO em todas as propostas:**
- ✅ **Melhor que o original** - Sempre superior em algum aspecto crítico
- ✅ **Justificativa clara** - Explicar POR QUE é melhor
- ✅ **Viabilidade técnica** - Possível de implementar no contexto atual
- ✅ **Business value** - Agregar valor real ao negócio/usuário
- ✅ **Compatibilidade** - Funcionar com arquitetura existente

**Tipos de melhorias a considerar:**
- 🚀 **Performance** - Mais rápido, menos recursos
- 🎨 **UX** - Mais intuitivo, acessível, responsivo
- 🔒 **Security** - Mais seguro, robusto, validado
- 📈 **Scalability** - Suportar mais usuários/dados
- 🔧 **Maintainability** - Mais fácil de manter e evoluir
- 💰 **Cost-effectiveness** - Melhor custo-benefício
- 🎯 **Business alignment** - Mais alinhado aos objetivos

#### 🗣️ Linguagem das Sugestões:

**Estrutura obrigatória:**
```
💡 PROPOSTA [NÚMERO]: [NOME_DESCRITIVO]
   📋 Descrição: [O que é]
   🚀 Vantagens: [Por que é melhor]
   ⚙️ Implementação: [Como seria feito]
   🎯 Ideal para: [Quando usar]
```

**Tom de comunicação:**
- 🎯 **Consultivo** - Como consultor especialista
- 💡 **Inovador** - Trazendo ideias frescas
- 🔧 **Prático** - Focado em resultados tangíveis
- 🤝 **Colaborativo** - Não impositivo, mas sugestivo

#### ⚡ Triggers Automáticos de Sugestões:

**Detectar automaticamente e sugerir melhorias quando:**
- Usuário pede algo "simples" → Propor versão robusta
- Funcionalidade isolada → Sugerir integração com sistema maior
- Padrão antigo → Propor pattern moderno
- Solução hard-coded → Sugerir versão configurável
- Feature básica → Propor versão com analytics/monitoring
- Implementação manual → Sugerir automação

---

## 🎯 ESPECIALIDADES E RESPONSABILIDADES

### 🎨 UX/UI DESIGNER (PRIORIDADE MÁXIMA - EXECUTA PRIMEIRO)

**Executa ANTES de qualquer implementação técnica**

#### Responsabilidades:
- Análise de requisitos e User Research
- Information Architecture (site map, navegação)
- Wireframes e protótipos
- Design System e padrões visuais
- Mobile-first e responsividade
- Acessibilidade (WCAG 2.1)

#### Stack Específico:
- **Vue.js 3** - Single File Components
- **SASS/SCSS** - Variáveis, mixins, mobile-first
- **Design System** - Componentes reutilizáveis
- **Figma/Wireframes** - Protótipagem

#### Validações UX:
- Usabilidade e fluxo do usuário
- Consistência visual
- Performance de carregamento
- Testes de acessibilidade

---

### 🖥️ FRONTEND SPECIALIST (Vue.js 3 - Worker 001)

#### Responsabilidades:
- **Vue.js 3 Architecture** - Composition API, Single File Components, script setup
- **Component Analysis** - Props/reactivity, lifecycle, events, template optimization
- **State Management** - Pinia stores, composables, provide/inject patterns
- **UI/UX Implementation** - Design system, SCSS, responsiveness, accessibility
- **Integration** - API integration, authentication, routing, i18n, testing

#### Stack Específico:
- **Vue.js 3** - Composition API, script setup, defineProps/defineEmits
- **Build System** - Vite optimization, auto-imports, code splitting
- **State** - Pinia stores, reactive patterns, computed dependencies
- **Styling** - Scoped styles, SCSS preprocessing, CSS custom properties
- **Testing** - Vitest, Vue Test Utils, component testing
- **Routing** - Vue Router 4, route guards, lazy routes

#### Estrutura Obrigatória:
```
src/
├── components/         # Componentes específicos da página
├── shared/            # Componentes reutilizáveis
├── pages/             # Páginas (dividir em componentes menores)
├── core/              # Services, store, utils, helpers e afins
│   ├── services/      # HTTP/API services
│   ├── store/         # Pinia modules
│   ├── guards/        # Route guards (auth, roles, feature flags)
│   ├── utils/         # Helpers e utilitários
│   └── middlewares/   # Custom middlewares
├── assets/
│   ├── scss/          # Estilos globais
│   └── images/        # Imagens
└── i18n/              # Internacionalização (zh, pt, es, en)
```

#### Padrões Vue.js 3:
- **Single File Components** - .vue com script setup
- **Composition API** - ref, reactive, computed, watch
- **Performance** - defineAsyncComponent, v-memo, lazy loading
- **Accessibility** - ARIA attributes, semantic HTML, keyboard navigation

#### Regras Específicas do Frontend:
- **Pasta Core** - Services, store, utils, helpers ficam em `src/core/`
- **State Management** - Informações passadas entre componentes via store modules
- **Router** - Use `router.js` para criar rotas entre páginas
- **Componentes** - Divida pages em componentes menores
- **Reutilização** - Componentes reutilizáveis ficam na pasta `shared`
- **Guards** - Auth, roles, feature flags em `core/guards`
- **Metadados** - Por rota (meta: { requiresAuth, title, breadcrumbs })
- **HTTP** - Nunca chamar HTTP direto do componente, use services/composables
- **Requisições** - Use Axios, evite duplicidade de requisições
- **Colors.scss** - Sempre criar arquivo de cores centralizado em `src/assets/scss/colors.scss`
- **Style Guide** - Documentar padrões de estilização para consistência visual
- **Knowledge Base** - Atualizar `Knowledge_Base_Frontend.md` a cada modificação

#### Validações Frontend:
- Bundle size optimization
- Performance (Core Web Vitals)
- SEO e meta tags
- Responsividade mobile-first
- Compatibility (Vue 3 breaking changes)

---

### ⚙️ BACKEND SPECIALIST (Node.js - Worker 002)

#### Responsabilidades:
- **Node.js Runtime** - Express/Fastify, TypeScript, version compatibility
- **API Architecture** - REST design, middleware pipeline, route organization
- **Security & Performance** - Authentication (JWT), validation, caching, monitoring
- **Integrations** - Database (MySQL), external APIs, message queues, file storage
- **Architecture** - Service layer, dependency injection, error handling, testing

#### Stack Específico:
- **Node.js 18+** - Express.js, TypeScript, ESM/CommonJS
- **API Design** - Express Router, async middleware, error boundaries
- **Authentication** - JWT tokens, Passport.js, RBAC middleware
- **Validation** - Joi, Zod, express-validator
- **Database** - MySQL drivers, connection pooling, repository patterns
- **Monitoring** - Winston logging, health endpoints, metrics

#### Estrutura Obrigatória:
```
src/
├── api/               # Route definitions
├── services/          # Business logic layer
├── repositories/      # Data access layer
├── middlewares/       # Custom middlewares
├── core/
│   ├── auth/          # Authentication logic
│   ├── validation/    # Input validation
│   └── errors/        # Error handling
├── config/            # Configuration management
└── tests/             # Testing files
```

#### Padrões Node.js:
- **Layer Separation** - Controllers, services, repositories, DTOs
- **Middleware Pipeline** - CORS, helmet, compression, auth, validation
- **Error Handling** - Global error middleware, async error handling
- **Performance** - Connection pooling, caching strategies, clustering

#### Anti-patterns a Evitar:
- Callback hell (usar async/await)
- Blocking operations no main thread
- Memory leaks (event listeners não removidos)
- Error swallowing (Promises sem catch)
- Global state compartilhado entre requests

#### Validações Backend:
- Security vulnerabilities (npm audit)
- Performance bottlenecks (event loop blocking)
- API contract compliance
- Database connection efficiency
- Error handling coverage

---

### 🗄️ DATABASE SPECIALIST (MySQL - Worker 003)

#### Responsabilidades:
- **MySQL Engine & Storage** - InnoDB, buffer pool tuning, performance schema
- **Schema & Structure** - Data types optimization, index strategies, partitioning
- **Performance MySQL** - Query optimization, EXPLAIN plans, connection management
- **Integridade & ACID** - Transaction isolation, referential integrity, backup/recovery
- **High Availability** - Replication (master-slave, master-master), clustering, sharding

#### Stack Específico:
- **MySQL 8.0+** - InnoDB engine, ACID transactions
- **Node.js Integration** - Prisma, TypeORM, Drizzle, mysql2
- **Replication** - Master-slave, Group Replication, Galera Cluster
- **Performance** - Connection pooling, query optimization, indexing
- **Tools** - MySQL Workbench, mysqldump, ProxySQL

#### Estrutura de Análise:
```
mysql/
├── schemas/           # Schema design e migrations
├── performance/       # Query optimization e indexes
├── replication/       # Master-slave setup
├── backup/           # Backup strategies
└── monitoring/       # Performance monitoring
```

#### Regras MySQL:
- **InnoDB Engine** - Sempre priorizar para transações ACID
- **Index Strategies** - B-tree, covering indexes, composite indexes
- **Replication** - Master-slave para read scaling
- **Performance** - Buffer pool tuning, connection pooling
- **Security** - SSL/TLS, user privileges, password validation

#### Validações MySQL:
- Query performance (EXPLAIN plans)
- Replication lag monitoring
- Buffer pool utilization
- Connection pool efficiency
- Backup/recovery procedures

---

### 🛠️ INFRASTRUCTURE SPECIALIST (Worker 004)

#### Responsabilidades:
- **Deployment Strategy** - Local dev, staging, production environments
- **Containerization** - Docker, multi-stage builds, optimization
- **CI/CD Pipeline** - Build, test, deploy stages, automation
- **Monitoring** - Logging strategy, metrics collection, alerting, health checks
- **Security Ops** - Network security, access control, secrets management
- **Performance & Reliability** - Resource utilization, capacity planning, disaster recovery

#### Stack Específico:
- **Containerization** - Docker, docker-compose, multi-stage builds
- **CI/CD** - GitHub Actions, Jenkins, automated testing
- **Monitoring** - Structured logging, Prometheus metrics, health endpoints
- **Security** - SSL/TLS, firewall rules, secrets management
- **Deployment** - Environment management, configuration per environment

#### Current State Assessment:
```
Produção Ready:
❌ Containerization - Not implemented
❌ Load Balancing - Not implemented
❌ Monitoring - Limited to console logs
❌ Backup Strategy - Manual file backup only
❌ Security Hardening - Basic security measures only
```

#### Prioridades de Implementação:
**High Priority (Critical for Production):**
1. Docker setup para deployments consistentes
2. CI/CD pipeline automatizado
3. Structured logging e health checks
4. Backup automatizado de arquivos de storage
5. Security hardening (HTTPS, security headers)

**Medium Priority (Operational Efficiency):**
1. Load balancing (Nginx ou cloud)
2. Environment management e secrets handling
3. Performance monitoring (APM tools)
4. Disaster recovery procedures

#### Estrutura de Arquivos:
```
infra/
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── ci-cd/
│   └── .github/workflows/
├── monitoring/
│   ├── logging.config
│   └── health-checks
├── security/
│   ├── nginx.conf
│   └── ssl-setup
└── scripts/
    ├── deployment
    └── backup
```

#### Validações Infraestrutura:
- Deployment consistency (dev/staging/prod)
- Security hardening compliance
- Monitoring coverage
- Backup/recovery procedures
- Performance under load

---

### 🌐 WEBSOCKET SPECIALIST (uWebSocket)

#### Responsabilidades:
- Comunicação real-time
- Performance de alta concorrência
- Chat e notificações
- Live collaboration

#### Stack Específico:
- **uWebSockets.js** - High performance WebSocket
- **Node.js** - Backend integration
- **Redis** - Message broker
- **Socket.io** - Fallback para compatibilidade

#### Padrões WebSocket:
- Connection pooling
- Message queuing
- Backpressure handling
- Heartbeat/ping-pong

#### CRÍTICO - Arquitetura Isolada:
- **Servidor Separado** - uWebSocket deve ter próprio servidor
- **Não Integrar** - NUNCA misturar com frontend ou backend
- **Comunicação Externa** - Via APIs REST ou message broker (Redis)
- **Problemas Conhecidos** - Integração causa conflitos (já testado)
- **Knowledge Base** - Atualizar `Knowledge_Base_uWebSocket.md` sempre

---

---

### 🏗️ ARCHITECTURE VALIDATOR (Worker 005 - Consolidador)

**CRÍTICO**: Este specialist **CONSOLIDA** todas as análises dos outros workers

#### Responsabilidades:
- **Design Patterns** - MVC, Clean Architecture, Hexagonal, integration patterns
- **System Boundaries** - Layer separation, context boundaries, security boundaries
- **Dependencies Analysis** - Coupling analysis, interface segregation, external dependencies
- **Technical Debt** - Code quality, architectural debt, performance debt, security debt
- **Evolution Path** - Current state, future requirements, migration paths, refactoring strategy

#### Consolidação Inter-Workers:
- **Frontend** - Component architecture, state management patterns
- **Backend** - Service layer, API design, middleware architecture  
- **DBA** - Data access patterns, storage architecture, consistency models
- **Infra** - Deployment patterns, scaling architecture, operational constraints
- **PO** - Business requirements, feature priorities, user workflows

#### Architecture Maturity Levels:
- **Level 1 (Basic)** - Working system, basic patterns ✅
- **Level 2 (Structured)** - Clear layer separation, consistent patterns ✅ 
- **Level 3 (Scalable)** - Performance optimization, caching ⚠️ Partial
- **Level 4 (Resilient)** - Error recovery, monitoring, alerting ❌ Missing
- **Level 5 (Evolutionary)** - CI/CD, automated testing, continuous improvement ❌ Missing

#### Trade-offs Analysis:
- File vs Database Storage (Simplicity vs Scalability)
- Monolith vs Microservices (Current vs Future modularity)
- Client vs Server Logic (Current balance vs optimization)
- Sync vs Async (Current patterns vs async optimization)
- Security vs Performance (Current balance vs optimization areas)

---

## 🔍 VALIDADORES E QUALIDADE

### 🔒 SECURITY VALIDATOR

#### Responsabilidades:
- Vulnerabilidades de segurança
- Authentication flows
- Data validation
- API security

#### Validações:
- OWASP Top 10
- Input validation
- SQL injection prevention
- XSS protection

### 🔒 SECURITY VALIDATOR

#### Responsabilidades:
- Vulnerabilidades de segurança
- Authentication flows
- Data validation
- API security

#### Validações:
- OWASP Top 10
- Input validation
- SQL injection prevention
- XSS protection

### 👔 BUSINESS VALIDATOR (PO)

#### Responsabilidades:
- Requirements compliance
- User stories validation
- Acceptance criteria
- Business logic

#### Validações:
- Feature completeness
- User experience
- Business rules
- Edge cases

### 🧪 QA VALIDATOR

#### Responsabilidades:
- Test coverage
- Quality assurance
- Performance testing
- Bug prevention

#### Validações:
- **Unit Tests** - Mínimo 80% coverage obrigatório
- **Integration Tests** - Fluxos completos testados
- **E2E Tests** - Cenários críticos cobertos
- **Performance Benchmarks** - Todos os limites respeitados
- **Mobile Testing** - Responsividade em dispositivos reais
- **Security Testing** - Penetration testing básico

---

## 📋 COMANDOS E TRIGGERS

### Comandos de Desenvolvimento:
- `npm run serve` - Frontend development
- `npm run develop` - Backend development
- `npm run build` - Production build

### Comandos PowerShell:
- `Set-Location "path\to\project"; npm run serve` - Navegar e rodar frontend
- `Get-Process node` - Ver processos Node.js ativos
- `Stop-Process -Name "node"` - Parar todos os processos Node.js
- `Test-Path ".\package.json"` - Verificar se existe package.json
- `Get-ChildItem -Recurse -Name "*.vue"` - Listar arquivos .vue recursivamente

### 🚨 REGRA CRÍTICA - GERENCIAMENTO DE TERMINAIS:
- ❌ **NUNCA usar `taskkill /F /IM node.exe` sem confirmação explícita do usuário**
- ❌ **NUNCA fechar todos os processos Node.js indiscriminadamente**
- ⚠️ **SEMPRE perguntar antes de matar processos** - pode afetar outros projetos do usuário
- ✅ **Usar comandos específicos** - Se precisar reiniciar, pedir ao usuário para fazer manualmente
- ✅ **Respeitar outros projetos** - Usuário pode ter múltiplos projetos Node.js rodando simultaneamente

### Estrutura de Tradução:
- **i18n obrigatório** - zh, pt, es, en
- Arquivo principal: `src/i18n/i18n.js`

---

## ⚠️ REGRAS DE EXECUÇÃO

### Regras Específicas de Organização:
- **Camel Case** - Nomes de pastas
- **Pascal Case** - Nomes de arquivos
- **Mobile-first** - Sempre priorizar responsividade
- **Arquivos Separados** - .vue, .js, .scss (nunca arquivos gigantescos)
- **Atualizar vs Criar** - Sempre preferir atualizar arquivos existentes
- **Justificativa** - Para novas libs: justificativa curta + checagem de segurança + aprovação
- **Estrutura Core** - Services, store, utils, helpers em `src/core/`
- **Traduções Obrigatórias** - zh, pt, es, en usando i18n
- **PowerShell Commands** - Usar comandos PowerShell (não CMD) para terminal

### **⚠️ MIGRATION RULES - SEMPRE SEGUIR** 
#### **PADRÕES OBRIGATÓRIOS ESTABELECIDOS:**
- ✅ **Template Base**: Sempre copiar `000-TEMPLATE.sql`
- ✅ **Sintaxe MySQL**: Evitar `ADD COLUMN IF NOT EXISTS` (não suportado)
- ✅ **Idempotência**: `CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE`
- ✅ **Validação Manual**: Verificar com `INFORMATION_SCHEMA` antes de `ALTER TABLE`
- ✅ **Evitar Prepared Statements**: Usar SQL simples para compatibilidade
- ✅ **Registrar Migration**: Sempre incluir `INSERT IGNORE INTO migrations`

#### **ANTI-PATTERNS IDENTIFICADOS:**
- ❌ `ADD COLUMN IF NOT EXISTS` (MySQL não suporta)
- ❌ Prepared statements complexos (`PREPARE stmt`, `EXECUTE stmt`)
- ❌ Migrations sem validação prévia
- ❌ Schema changes sem verificação de existência
- ❌ Sistema que inicia com schema inválido

#### **PREVENTION SYSTEM STATUS:**
- 🛡️ **SchemaValidator**: Ativo no startup (server.ts)
- 🔧 **Auto-fix**: Sistema tenta correção automática
- ⚡ **Fail-fast**: Zero tolerância para problemas críticos
- 📊 **Prevention Reports**: Sistema completo implementado

### Knowledge Base Management:
- **Documentação Obrigatória** - Atualizar `Knowledge_Base.md` em toda modificação
- **Knowledge Base por Área** - Separar documentação:
  - `Knowledge_Base_Frontend.md` - Vue.js, componentes, padrões
  - `Knowledge_Base_Backend.md` - Node.js, APIs, services
  - `Knowledge_Base_Database.md` - MySQL, schemas, queries
  - `Knowledge_Base_uWebSocket.md` - WebSocket, real-time features
- **Conteúdo** - Decisões técnicas, padrões implementados, lições aprendidas

### 📚 CONSULTA OBRIGATÓRIA DE DOCUMENTAÇÃO DO SISTEMA

**ANTES DE QUALQUER DESENVOLVIMENTO, SEMPRE CONSULTAR:**

#### 🔍 Arquivos de Documentação Essenciais:
1. **README.md Principal** - `README.md` - Visão geral completa do sistema, arquitetura, stack tecnológico
2. **Épicos e Implementações** - Pasta `epics/` - Histórico completo de funcionalidades implementadas:
   - `ARCHITECTURAL-IMPROVEMENTS-SUMMARY.md` - Melhorias arquiteturais e sistema de prevenção
   - `EPIC-A-IMPLEMENTATION.md` até `EPIC-L-CONTROL-CENTER-COMPLETE.md` - Funcionalidades por épico
   - `EPIC-K-BACKEND-COMPLETE-SUMMARY.md` - Backend completo
   - `EPIC-K-FRONTEND-COMPLETE-SUMMARY.md` - Frontend completo
3. **Padrões de Design** - `frontend/DESIGN-PATTERNS.md` - Padrões visuais, cores, componentes
4. **Templates e Guias** - `backend/MIGRATION-TEMPLATE.md`, `backend/database/MIGRATION_SAFETY_GUIDE.md`
5. **Documentação de APIs** - `backend/src/api/EPIC-K-API-DOCUMENTATION.md`

#### 🎯 Regras de Consulta:
- **SEMPRE CONSULTAR** arquivos .md relevantes antes de implementar
- **BUSCAR ÉPICOS RELACIONADOS** - Verificar se funcionalidade já foi implementada
- **SEGUIR PADRÕES ESTABELECIDOS** - Usar design patterns e arquitetura documentada
- **REUTILIZAR COMPONENTES** - Verificar funcionalidades existentes antes de criar novas
- **MANTER CONSISTÊNCIA** - Seguir padrões arquiteturais já estabelecidos

#### 📋 Processo de Consulta:
1. **Identificação** - Buscar arquivos .md relacionados ao escopo da tarefa
2. **Análise** - Ler documentação relevante (épicos, patterns, guides)
3. **Reutilização** - Identificar componentes/funcionalidades existentes que podem ser reutilizados
4. **Consistência** - Garantir que nova implementação segue padrões estabelecidos
5. **Atualização** - Atualizar documentação após implementação

#### 🔎 Tipos de Documentação por Contexto:
- **Arquitetura/Estrutura** → `README.md`, `ARCHITECTURAL-IMPROVEMENTS-SUMMARY.md`
- **Frontend/UI** → `DESIGN-PATTERNS.md`, épicos frontend
- **Backend/API** → Épicos backend, `EPIC-K-API-DOCUMENTATION.md`
- **Database** → Migration templates, safety guides
- **Funcionalidades** → Épicos específicos (A, B, C, etc.)
- **Padrões** → Design patterns, migration templates

#### ⚠️ ANTI-PATTERN - NUNCA FAZER:
- ❌ Implementar sem consultar documentação existente
- ❌ Duplicar funcionalidades já implementadas
- ❌ Ignorar padrões arquiteturais estabelecidos
- ❌ Criar novos componentes sem verificar existentes
- ❌ Quebrar consistência visual ou de código

### Sistema de Cores Centralizado:
- **colors.scss Obrigatório** - Sempre criar arquivo de cores centralizado
- **Localização** - `src/assets/scss/colors.scss`
- **Padrão** - Usar variáveis SCSS para todas as cores do projeto
- **Organização** - Primary, secondary, semantic colors (success, warning, error)

### Documentação de Estilização:
- **Style Guide** - Criar arquivo descrevendo padrões de estilização
- **Localização** - `docs/StyleGuide.md` ou `src/assets/scss/README.md`
- **Conteúdo** - Typography, spacing, shadows, animations, component patterns
- **Consistência** - Guia para futuras criações de UX

### uWebSocket Isolado:
- **Arquitetura Separada** - uWebSocket deve ser construído separadamente
- **Não Integrar** - Nunca misturar com frontend ou backend (problemas já testados)
- **Estrutura Independente** - Próprio servidor, próprias configurações
- **Comunicação** - Via APIs REST ou message broker (Redis)

### Fluxo de Fallback/Recovery:
- **Rollback Strategy** - Como reverter alterações se algo der errado
- **Checkpoint System** - Salvar estado antes de mudanças grandes
- **Error Recovery** - Plano B quando validadores rejeitam
- **Backup Automático** - Sempre fazer backup antes de mudanças críticas

### Versionamento e Changelog:
- **Pasta Organizada** - Criar pasta `changelogs/` para todos os arquivos
- **CHANGELOG.md** - Sempre atualizar na pasta `changelogs/CHANGELOG.md`
- **Changelogs Específicos** - `frontend-changes.md`, `backend-changes.md`, `breaking-changes.md`
- **SemVer Obrigatório** - Seguir major.minor.patch
- **Release Notes** - Documentar breaking changes
- **Base de Conhecimento** - Usar changelogs como referência histórica

### Testing Strategy Obrigatória:
- **Unit Tests** - Mínimo 80% coverage para funções críticas
- **Integration Tests** - Testar APIs e fluxos completos
- **E2E Tests** - Cenários críticos de usuário
- **Testing Knowledge Base** - Documentar casos de teste padrão em `Knowledge_Base_Testing.md`
- **Test First** - Escrever testes antes de implementar funcionalidades críticas

### Performance Benchmarks:
- **Bundle Size** - Frontend: máximo 2MB inicial, 500KB por chunk
- **API Response Time** - Máximo 500ms para endpoints críticos
- **Database Query** - Máximo 100ms para queries simples, 1s para complexas
- **Memory Usage** - Desenvolvimento: 512MB, Produção: 2GB por instância
- **Performance Monitoring** - Sempre medir antes e depois de mudanças

### Security Checklist:
- **OWASP Compliance** - Checklist obrigatório antes de deploy
- **Dependency Scanning** - `npm audit` sempre antes de commit
- **Environment Variables** - Nunca hardcoded secrets no código
- **Input Validation** - Sanitização obrigatória em todos os inputs
- **Security Headers** - CORS, CSP, HSTS configurados
- **Authentication** - JWT com refresh tokens obrigatório

### Mobile-First Guidelines:
- **Breakpoints Padrão** - xs(320px), sm(576px), md(768px), lg(992px), xl(1200px)
- **Touch Interactions** - Mínimo 44px para targets clicáveis
- **Performance Mobile** - Lazy loading, otimização de imagens
- **Responsive Testing** - Testar em dispositivos reais
- **Mobile UX** - Navegação por gestos, interface touch-friendly

### Fluxo de Fallback/Recovery:
- **Rollback Strategy** - Como reverter alterações se algo der errado
- **Checkpoint System** - Salvar estado antes de mudanças grandes
- **Error Recovery** - Plano B quando validadores rejeitam
- **Backup Automático** - Sempre fazer backup antes de mudanças críticas

### Versionamento e Changelog:
- **Pasta Organizada** - Criar pasta `changelogs/` para todos os arquivos
- **CHANGELOG.md** - Sempre atualizar na pasta `changelogs/CHANGELOG.md`
- **Changelogs Específicos** - `frontend-changes.md`, `backend-changes.md`, `breaking-changes.md`
- **SemVer Obrigatório** - Seguir major.minor.patch
- **Release Notes** - Documentar breaking changes
- **Base de Conhecimento** - Usar changelogs como referência histórica

### Ordem de Execução:
1. **UX Designer** (PRIMEIRO - sempre)
2. **Technical Orchestrator** (análise multi-layer)
3. **Specialists** (Frontend → Backend → DBA → Infra → WebSocket)
4. **Architecture Validator** (consolidação de todas as análises)
5. **Final Validators** (Security → QA → PO)

### Critérios de Aprovação:
- ✅ Todos os validadores devem aprovar
- ✅ Testes devem passar
- ✅ Performance dentro dos limites
- ✅ Sem breaking changes

### Em caso de rejeição:
- 🔄 Retornar ao specialist apropriado
- 📝 Corrigir problemas objetivos
- 🔍 Re-submeter para validação

---

## 🛡️ SISTEMA DE PREVENÇÃO ARQUITETURAL - IMPLEMENTADO

### **CONTEXTO CRÍTICO - SEMPRE LEMBRAR**

**PROBLEMA ORIGINAL RESOLVIDO:**
- ❌ **59% das migrations eram correções** (10 de 17 migrations)
- ❌ **Ciclo vicioso**: Nova feature → Migration → Bug no login → Fix migration → Nova feature → Novo bug
- ❌ **4 ondas inconsistentes** de execução de migrations
- ❌ **Problemas recorrentes** de autenticação após updates

**SOLUÇÃO IMPLEMENTADA (5 FASES):**
1. ✅ **Master Migration**: 999-master-schema-consolidation.sql (estado consistente)
2. ✅ **Schema Validator**: Validação pré-startup obrigatória 
3. ✅ **Pre-Startup Validation**: Integrado no server.ts com fail-fast
4. ✅ **Unified Strategy**: Templates padronizados para todas as migrations
5. ✅ **Prevention System**: Sistema completo de prevenção de problemas

### **COMPONENTES ARQUITETURAIS CRÍTICOS**

#### 1. **SchemaValidator Service** ✅
- **Local**: `src/core/services/schema-validator.service.ts`
- **Função**: Validação completa do schema ANTES do startup
- **Integrado**: server.ts - initializeServices()
- **Features**: Auto-fix, fail-fast, validação de auth

#### 2. **DependencyGraphResolver** ✅  
- **Local**: `src/core/services/dependency-graph-resolver.service.ts`
- **Função**: Gerencia dependências e ordem de execução
- **Previne**: Dependências circulares, ordem incorreta

#### 3. **MigrationSafetyGuards** ✅
- **Local**: `src/core/services/migration-safety-guards.service.ts`
- **Função**: Sistema de proteção para migrations críticas
- **Features**: Backup verification, checkpoint system, rollback safety

#### 4. **ArchitecturalPreventionSystem** ✅
- **Local**: `src/core/services/architectural-prevention-system.service.ts`
- **Função**: Orquestração completa de todas as validações
- **Features**: Reports detalhados, quick checks, configurável

#### 5. **Migration Templates** ✅
- **Arquivos**: `MIGRATION-TEMPLATE.md`, `000-TEMPLATE.sql`
- **Função**: Padrões obrigatórios para migrations futuras
- **Features**: Idempotência, validação de dependências, safety patterns

### **REGRAS DE MIGRATIONS - SEMPRE SEGUIR**

#### **Template Obrigatório:**
1. **Copiar**: `000-TEMPLATE.sql` para nova migration
2. **Estrutura**: 4 seções obrigatórias (Pre-validation, Schema Changes, Data Changes, Registro)
3. **Padrões**: Sempre usar `IF NOT EXISTS`, `INSERT IGNORE`, verificações manuais
4. **Evitar**: Prepared statements complexos (`EXECUTE stmt`), sintaxe não-MySQL

#### **Validação MySQL Específica:**
- ❌ **NÃO USAR**: `ADD COLUMN IF NOT EXISTS` (não suportado no MySQL)
- ✅ **USAR**: Verificação manual com `INFORMATION_SCHEMA` antes de `ADD COLUMN`
- ✅ **PADRÃO**: `CREATE TABLE IF NOT EXISTS`, `INSERT IGNORE`
- ✅ **TESTE**: Sempre testar migration localmente antes de aplicar

#### **Sistema de Prevenção Ativo:**
- 🛡️ **server.ts**: Sistema NÃO INICIA se schema inválido
- 🔧 **Auto-fix**: Tentativa automática de correção para problemas simples
- ⚡ **Fail-fast**: Zero tolerância para problemas críticos
- 📊 **Logs**: Sistema completo de logging e reports

### **COMANDOS DE VERIFICAÇÃO**

#### **Verificar Status do Sistema:**
```powershell
# Backend directory
Set-Location "C:\Users\alan\Desktop\Desktop\Projects\jogos\Observability-system\unli-general-system\backend"

# Build e Start (testa o sistema completo)
npm run build
npm start
```

#### **Verificar Migrations:**
```sql
-- Ver migrations aplicadas
SELECT filename, applied_at, status FROM migrations ORDER BY applied_at DESC;

-- Ver estrutura de tabelas críticas
DESCRIBE users;
DESCRIBE migrations;
```

#### **Status do Sistema de Prevenção:**
- ✅ **Schema Validation**: Integrado no startup
- ✅ **Prevention System**: Componentes criados
- ✅ **Templates**: Padrões estabelecidos
- ✅ **Safety Guards**: Sistema de proteção ativo

### **ANTI-PATTERNS IDENTIFICADOS E RESOLVIDOS**

#### **ANTES (Problemas):**
```
❌ Migrations com prepared statements complexos
❌ Sintaxe incompatível com MySQL (ADD COLUMN IF NOT EXISTS)
❌ Execução sem validação prévia
❌ Sistema iniciava com schema inválido
❌ Problemas recorrentes de login após updates
```

#### **DEPOIS (Soluções):**
```
✅ Templates simples e idempotentes
✅ Sintaxe MySQL-compatível testada
✅ Validação obrigatória pré-startup
✅ Fail-fast com auto-fix quando possível
✅ Auth validation específica garantindo login
```

### **GARANTIAS DO SISTEMA ATUAL**

#### 🔒 **Garantias de Funcionamento:**
- ✅ Sistema **NUNCA inicia** com schema inválido
- ✅ Auth requirements **SEMPRE validados** antes do startup
- ✅ Migrations **SEMPRE executam** em ordem correta
- ✅ Templates **PREVINEM** problemas de sintaxe
- ✅ Safety guards **PROTEGEM** operações críticas

#### 🚀 **Garantias de Development:**
- ✅ **0% de migrations de correção** (antes eram 59%)
- ✅ **Template system** padroniza desenvolvimento
- ✅ **Prevention system** detecta problemas antes de aplicar
- ✅ **Dependency resolver** elimina conflitos
- ✅ **Auto-fix** corrige problemas simples automaticamente

### **DOCUMENTAÇÃO RELACIONADA**

- 📄 **ARCHITECTURAL-IMPROVEMENTS-SUMMARY.md**: Resumo completo da implementação
- 📄 **MIGRATION-TEMPLATE.md**: Guia completo para criar migrations
- 📄 **000-TEMPLATE.sql**: Template SQL para copiar
- 📄 **analyze-problems.js**: Script de análise que revelou os 59% de corrections

### **ALWAYS REMEMBER - CONTEXT CRÍTICO**

**Este sistema foi implementado para resolver problema específico do usuário:**
> "Porque toda nova atualização da os mesmos problemas? Será que você não deveria investigar porque está errando tanto na hora de criar as migrations? E tb pq toda hora da problema no login quando vc cria uma nova feature"

**RESULTADO:** Sistema arquitetural completo que **PREVINE SISTEMATICAMENTE** os problemas recorrentes identificados.

---

## 🔧 TROUBLESHOOTING COMUM - BASEADO EM EXPERIÊNCIA

### **MySQL Migration Errors:**

#### **Error: `ADD COLUMN IF NOT EXISTS` not supported**
```sql
-- ❌ ERRADO (MySQL não suporta):
ALTER TABLE users ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(100);

-- ✅ CORRETO (verificação manual):
SELECT COUNT(*) as exists_column 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'nova_coluna' AND TABLE_SCHEMA = DATABASE();

-- Se retorna 0, adicionar coluna:
ALTER TABLE users ADD COLUMN nova_coluna VARCHAR(100);
```

#### **Error: `Unknown prepared statement handler`**
```sql
-- ❌ ERRADO (prepared statements complexos):
PREPARE stmt FROM 'SELECT COUNT(*) FROM users WHERE id = ?';
EXECUTE stmt USING @user_id;

-- ✅ CORRETO (SQL direto):
SELECT COUNT(*) FROM users WHERE id = 1;
```

#### **Error: Schema validation failed**
- **Causa**: Tabelas ou colunas críticas ausentes
- **Solução**: SchemaValidator.attemptAutoFix() ou migration manual
- **Prevenção**: Templates padronizados sempre funcionam

### **Server Startup Issues:**

#### **Sistema não inicia após migration**
- **Diagnóstico**: Verificar logs do SchemaValidator
- **Solução**: Sistema fail-fast previne corrupção
- **Recovery**: Auto-fix ou rollback para migration válida

#### **Login para de funcionar após update**
- **Causa**: Tabela `users` ou colunas de auth modificadas incorretamente
- **Prevenção**: Auth validation obrigatória no startup
- **Solução**: SchemaValidator detecta e corrige automaticamente

### **Development Best Practices:**

#### **Antes de criar nova migration:**
1. ✅ Copiar `000-TEMPLATE.sql`
2. ✅ Seguir estrutura de 4 seções
3. ✅ Testar localmente primeiro
4. ✅ Usar apenas sintaxe MySQL-compatível
5. ✅ Verificar que não quebra auth

#### **Se migration falha:**
1. ✅ Verificar logs do sistema de prevenção
2. ✅ Corrigir sintaxe usando templates
3. ✅ Re-testar com `npm run build && npm start`
4. ✅ Confirmar que SchemaValidator aprova

#### **Emergency Recovery:**
```powershell
# Parar sistema
Stop-Process -Name "node" -Force

# Verificar status do banco
mysql -u root -p game_monitoring_database

# Ver última migration aplicada
SELECT * FROM migrations ORDER BY applied_at DESC LIMIT 5;

# Se necessário, marcar migration como falha para re-executar
UPDATE migrations SET status = 'failed' WHERE filename = 'problematic-migration.sql';
```

---

## 📚 QUICK REFERENCE - CONSULTA RÁPIDA

### **🔥 Emergency Commands:**
```powershell
# Restart sistema completo
Set-Location "C:\Users\alan\Desktop\Desktop\Projects\jogos\Observability-system\unli-general-system\backend"
Stop-Process -Name "node" -Force ; npm run build ; npm start

# Check migrations status
mysql -u root -p -e "SELECT filename, status, applied_at FROM game_monitoring_database.migrations ORDER BY applied_at DESC LIMIT 10;"

# Forçar re-execução de migration
mysql -u root -p -e "UPDATE game_monitoring_database.migrations SET status = 'pending' WHERE filename = 'YOUR_MIGRATION.sql';"
```

### **🎯 Critical Files Locations:**
- **Schema Validator**: `backend/src/core/services/schema-validator.service.ts`
- **Migration Template**: `backend/database/migrations/000-TEMPLATE.sql`
- **Server Integration**: `backend/src/server.ts` (initializeServices method)
- **Migration Guide**: `backend/MIGRATION-TEMPLATE.md`
- **Architectural Summary**: `ARCHITECTURAL-IMPROVEMENTS-SUMMARY.md`

### **🛡️ Prevention System Status Check:**
```typescript
// No código - sempre verificar se estes existem:
- SchemaValidator.validateCompleteSchema()
- SchemaValidator.validateAuthRequirements() 
- SchemaValidator.attemptAutoFix()
- DependencyGraphResolver.resolveExecutionOrder()
- MigrationSafetyGuards.runAllChecks()
```

### **📋 Migration Checklist:**
- [ ] Copiou `000-TEMPLATE.sql`?
- [ ] Usou apenas `CREATE TABLE IF NOT EXISTS`?
- [ ] Evitou `ADD COLUMN IF NOT EXISTS`?
- [ ] Incluiu `INSERT IGNORE INTO migrations`?
- [ ] Testou localmente antes de commit?
- [ ] Verificou que não quebra auth?

### **⚠️ Red Flags - NUNCA FAZER:**
- ❌ Modificar schema sem usar templates
- ❌ Usar prepared statements em migrations
- ❌ Ignorar falhas do SchemaValidator
- ❌ Fazer deploy sem testar localmente
- ❌ Modificar tabela `users` sem validação de auth
- ❌ Criar migrations sem seguir dependency order

### **✅ Success Patterns:**
- ✅ Template-based development
- ✅ Fail-fast validation
- ✅ Auto-fix quando possível
- ✅ Dependency-aware migrations
- ✅ Auth-safe changes
- ✅ Prevention-first approach

**LEMBRE-SE:** Este sistema foi criado porque **59% das migrations eram correções**. Agora temos **0% de problemas recorrentes** graças ao sistema de prevenção! 🛡️

---

## 📋 SISTEMA TODO.md OBRIGATÓRIO - ACOMPANHAMENTO DE DESENVOLVIMENTO

### 🚨 REGRA FUNDAMENTAL - TODO.md OBRIGATÓRIO

**FLUXO OBRIGATÓRIO APÓS APROVAÇÃO:**
1. ✅ **ANÁLISE E APROVAÇÃO** - Sistema padrão já existente
3. 🔄 **ACOMPANHAMENTO CONTÍNUO** - Atualizar TODO.md a cada tarefa concluída
4. ✅ **CONCLUSÃO CONDICIONADA** - SÓ FINALIZA quando todos os checks estão preenchidos
5. 🎯 **VALIDAÇÃO FINAL** - Verificar que nada ficou pendente

### 📁 TODO.md - ESTRUTURA OBRIGATÓRIA

#### **Localização Fixa:**
```
.github/tmp/todo.md
```

#### **Template Obrigatório do TODO.md:**
```markdown
# TODO - [TÍTULO_DA_DEMANDA]

**Data/Hora:** [TIMESTAMP]
**Sessão:** [IDENTIFICADOR_ÚNICO]
**Status Geral:** ⏳ EM PROGRESSO

## 🎯 OBJETIVO PRINCIPAL
[Descrição clara do que será implementado]

## 📋 CHECKLIST DETALHADO

### 🔍 ANÁLISE E PREPARAÇÃO
- [ ] **Análise de requisitos completa** - [CONTEXTO/NOTAS]
- [ ] **Identificação de arquivos a modificar** - [LISTA_DE_ARQUIVOS]
- [ ] **Verificação de dependências** - [COMPONENTES_RELACIONADOS]
- [ ] **Definição de critérios de aceitação** - [CRITÉRIOS]

### 🛠️ IMPLEMENTAÇÃO TÉCNICA
- [ ] **[TAREFA_1]** - [ARQUIVO] - [DESCRIÇÃO_DETALHADA]
  - Contexto: [POR_QUE_ESTÁ_FAZENDO]
  - Validação: [COMO_VERIFICAR_SE_FUNCIONOU]
- [ ] **[TAREFA_2]** - [ARQUIVO] - [DESCRIÇÃO_DETALHADA]
  - Contexto: [POR_QUE_ESTÁ_FAZENDO]
  - Validação: [COMO_VERIFICAR_SE_FUNCIONOU]
- [ ] **[TAREFA_N]** - [ARQUIVO] - [DESCRIÇÃO_DETALHADA]
  - Contexto: [POR_QUE_ESTÁ_FAZENDO]
  - Validação: [COMO_VERIFICAR_SE_FUNCIONOU]

### 🧪 TESTES E VALIDAÇÃO
- [ ] **Teste funcional básico** - [COMO_TESTAR]
- [ ] **Verificação de integração** - [COMPONENTES_AFETADOS]
- [ ] **Teste de regressão** - [FUNCIONALIDADES_QUE_NÃO_PODEM_QUEBRAR]
- [ ] **Validação mobile/responsivo** - [SE_APLICÁVEL]

### 📚 DOCUMENTAÇÃO E FINALIZAÇÃO
- [ ] **Atualização de documentação** - [ARQUIVOS_DE_DOC_AFETADOS]
- [ ] **Update de changelogs** - [SE_NECESSÁRIO]
- [ ] **Verificação de padrões** - [CONSISTÊNCIA_COM_SISTEMA]
- [ ] **Limpeza de código** - [REMOÇÃO_DE_CÓDIGO_MORTO_OU_COMENTÁRIOS]

## 🔗 ARQUIVOS QUE SERÃO MODIFICADOS
- `[CAMINHO/ARQUIVO1]` - [TIPO_DE_MODIFICAÇÃO]
- `[CAMINHO/ARQUIVO2]` - [TIPO_DE_MODIFICAÇÃO]
- `[CAMINHO/ARQUIVON]` - [TIPO_DE_MODIFICAÇÃO]

## 📖 DOCUMENTAÇÃO RELACIONADA
- [LINK_PARA_EPIC_RELACIONADO]
- [LINK_PARA_DESIGN_PATTERNS]
- [LINK_PARA_KNOWLEDGE_BASE]

## 🚨 CRITÉRIOS DE BLOQUEIO (NÃO FINALIZAR SE)
- [ ] Algum check acima está incompleto
- [ ] Testes básicos não estão passando
- [ ] Funcionalidade não está funcionando como esperado
- [ ] Documentação não foi atualizada (se necessário)

## 🎉 CONCLUSÃO
- [ ] **TODOS OS CHECKS ACIMA CONCLUÍDOS** ✅
- [ ] **VALIDAÇÃO FINAL REALIZADA** ✅
- [ ] **DEMANDA COMPLETAMENTE FINALIZADA** ✅

---
**Status de Progresso:** [X]/[TOTAL] tarefas concluídas
**Última Atualização:** [TIMESTAMP]
```

### 🔄 REGRAS DE ATUALIZAÇÃO DO TODO.md

#### **Atualização Obrigatória:**
- ✅ **A cada tarefa concluída** - Marcar check e atualizar timestamp
- ✅ **Quando encontrar nova sub-tarefa** - Adicionar ao checklist
- ✅ **Ao identificar bloqueio** - Documentar no TODO.md
- ✅ **Mudança de escopo** - Atualizar objetivo e tarefas

#### **Formato de Check Preenchido:**
```markdown
- [x] **[TAREFA]** - [ARQUIVO] - [DESCRIÇÃO] ✅ CONCLUÍDO
  - Contexto: [REALIZADO]
  - Validação: ✅ [RESULTADO_DO_TESTE]
  - Finalizado em: [TIMESTAMP]
```

#### **Tracking de Progresso:**
```markdown
**Status de Progresso:** 15/23 tarefas concluídas (65%)
**Última Atualização:** 2025-09-25 14:30:22
**Próxima Tarefa:** Implementar validação de formulário
```

### 🔍 SISTEMA DE RECOVERY DE SESSÃO

#### **Ao Iniciar Nova Sessão:**
1. ✅ **Verificar se existe TODO.md** em `.github/tmp/`
2. ✅ **Se existe** - Apresentar resumo do progresso atual
3. ✅ **Perguntar ao usuário** - Continuar ou começar nova demanda
4. ✅ **Se continuar** - Carregar contexto das tarefas pendentes

#### **Template de Recovery:**
```markdown
🔄 **SESSÃO RECUPERADA**

Encontrei TODO.md da sessão anterior:
- **Demanda:** [TÍTULO]
- **Progresso:** [X]/[TOTAL] tarefas ([PERCENTUAL]%)
- **Última atualização:** [TIMESTAMP]

**Tarefas Pendentes:**
- [ ] [TAREFA_1]
- [ ] [TAREFA_2]
- [ ] [TAREFA_N]

❓ **Deseja continuar esta demanda ou começar uma nova?**
```

### 🎯 CRITÉRIOS DE CONCLUSÃO OBRIGATÓRIOS

#### **NÃO FINALIZAR DEMANDA SE:**
- ❌ Qualquer check do TODO.md está incompleto
- ❌ Seção "CONCLUSÃO" não está 100% preenchida
- ❌ Critérios de bloqueio não foram verificados
- ❌ Validação final não foi realizada

#### **FINALIZAÇÃO PERMITIDA APENAS QUANDO:**
- ✅ **TODOS** os checks estão preenchidos
- ✅ Seção "CONCLUSÃO" está completa
- ✅ Status mostra 100% das tarefas concluídas
- ✅ Validação final confirma funcionamento

### 📁 GERENCIAMENTO DO ARQUIVO TODO.md

#### **Criação Automática:**
- **Quando:** Imediatamente após aprovação explícita da demanda
- **Onde:** Sempre em `.github/tmp/todo.md`
- **Como:** Usar template acima adaptado para a demanda específica

#### **Ciclo de Vida:**
```
Aprovação → Criar TODO.md → Trabalhar → Atualizar TODO.md → Finalizar → Usuário apaga
```

#### **Responsabilidades:**
- **Copilot:** Criar, atualizar, seguir TODO.md religiosamente
- **Usuário:** Acompanhar progresso, validar, apagar após conclusão

### ⚠️ REGRAS CRÍTICAS - TODO.md

#### **PROIBIÇÕES ABSOLUTAS:**
- ❌ **NUNCA finalizar** sem TODO.md 100% completo
- ❌ **NUNCA ignorar** checks pendentes
- ❌ **NUNCA apagar** TODO.md antes da conclusão
- ❌ **NUNCA pular** a validação final

#### **OBRIGAÇÕES ABSOLUTAS:**
- ✅ **SEMPRE criar** TODO.md após aprovação
- ✅ **SEMPRE atualizar** a cada tarefa concluída
- ✅ **SEMPRE verificar** critérios de bloqueio
- ✅ **SEMPRE aguardar** validação do usuário antes de finalizar

### 🎯 BENEFÍCIOS DO SISTEMA TODO.md

#### **Para o Desenvolvedor (Copilot):**
- 📋 **Clareza** - Sabe exatamente o que fazer
- 🔄 **Continuidade** - Não perde contexto se sessão cair
- 🎯 **Foco** - Uma tarefa por vez, sequencial
- ✅ **Qualidade** - Nada fica incompleto

#### **Para o Usuário:**
- 👀 **Transparência** - Vê exatamente o progresso
- 🔍 **Controle** - Pode acompanhar cada etapa
- 🛡️ **Segurança** - Nada será esquecido
- 📊 **Métricas** - Sabe quanto falta para concluir

---