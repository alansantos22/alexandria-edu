# Database Architecture - Hell's December

**Data de Criação:** 29/10/2025  
**Stack Principal:** MySQL 8.0+

---

## 🎯 PRINCÍPIOS FUNDAMENTAIS

### Performance First
- Stored procedures para queries recorrentes (reduz latência)
- Indexes estratégicos em colunas de busca frequente
- Particionamento de tabelas grandes (chunks, logs)
- Query optimization obrigatória

### Data Integrity
- Foreign keys para relacionamentos
- Constraints para validação de dados
- Transactions para operações críticas
- Backup automatizado

### Escalabilidade
- Design para suportar milhões de registros
- Particionamento por chunk/region
- Read replicas para queries pesadas
- Cache layer (Redis) para dados hot

---

## 📦 STACK TECNOLÓGICO

### Database Engine
- **MySQL 8.0+** (InnoDB engine)
- **Charset:** utf8mb4 (suporte completo a emojis e caracteres especiais)
- **Collation:** utf8mb4_unicode_ci

### Ferramentas
```json
{
  "mysql2": "^3.x",          // Node.js driver
  "typeorm": "^0.3.x",       // ORM
  "@nestjs/typeorm": "^10.x" // NestJS integration
}
```

### Otimização e Monitoramento
- **Query Profiler** - Análise de performance
- **Slow Query Log** - Identificar queries lentas
- **EXPLAIN** - Otimizar execution plans
- **MySQL Workbench** - Gestão visual

---

## 📁 ESTRUTURA DE BANCO DE DADOS

### Nomenclatura Obrigatória
- **Tabelas:** snake_case plural (ex: `users`, `player_inventories`, `game_chunks`)
- **Colunas:** snake_case (ex: `created_at`, `player_id`, `is_active`)
- **Indexes:** `IDX_{TABELA}_{COLUNA}` (ex: `IDX_USERS_EMAIL`)
- **Foreign Keys:** `FK_{TABELA_ORIGEM}_{TABELA_DESTINO}` (ex: `FK_PLAYERS_USERS`)
- **Stored Procedures:** `sp_{acao}_{entidade}` (ex: `sp_get_player_inventory`)
- **Functions:** `fn_{nome}` (ex: `fn_calculate_distance`)

---

## 🗄️ SCHEMA PRINCIPAL

### 1. Tabelas de Core (Sistema)

#### users (Usuários)
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX IDX_USERS_EMAIL (email),
  INDEX IDX_USERS_USERNAME (username),
  INDEX IDX_USERS_LAST_LOGIN (last_login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### sessions (Sessões de Autenticação)
```sql
CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX IDX_SESSIONS_USER (user_id),
  INDEX IDX_SESSIONS_TOKEN (token_hash),
  INDEX IDX_SESSIONS_EXPIRES (expires_at),
  
  FOREIGN KEY FK_SESSIONS_USERS (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. Tabelas do Jogo (ECS - Entity Component System)

#### players (Entidade Jogador)
```sql
CREATE TABLE players (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  
  -- Posição
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  chunk_x INT NOT NULL DEFAULT 0,
  chunk_y INT NOT NULL DEFAULT 0,
  
  -- Stats
  health INT NOT NULL DEFAULT 100,
  max_health INT NOT NULL DEFAULT 100,
  mana INT NOT NULL DEFAULT 100,
  max_mana INT NOT NULL DEFAULT 100,
  stamina INT NOT NULL DEFAULT 100,
  max_stamina INT NOT NULL DEFAULT 100,
  
  -- Level
  level INT NOT NULL DEFAULT 1,
  experience INT NOT NULL DEFAULT 0,
  
  -- Status
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX IDX_PLAYERS_USER (user_id),
  INDEX IDX_PLAYERS_CHUNK (chunk_x, chunk_y),
  INDEX IDX_PLAYERS_POSITION (position_x, position_y),
  INDEX IDX_PLAYERS_ONLINE (is_online),
  
  FOREIGN KEY FK_PLAYERS_USERS (user_id) 
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### npcs (NPCs)
```sql
CREATE TABLE npcs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type VARCHAR(50) NOT NULL,  -- merchant, quest_giver, guard, etc.
  name VARCHAR(100) NOT NULL,
  
  -- Posição
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  chunk_x INT NOT NULL,
  chunk_y INT NOT NULL,
  
  -- Stats
  health INT NOT NULL DEFAULT 100,
  max_health INT NOT NULL DEFAULT 100,
  
  -- Comportamento
  behavior_type VARCHAR(50),  -- stationary, patrol, aggressive
  dialogue_id VARCHAR(36),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  respawn_time INT,  -- segundos
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX IDX_NPCS_CHUNK (chunk_x, chunk_y),
  INDEX IDX_NPCS_TYPE (type),
  INDEX IDX_NPCS_ACTIVE (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### enemies (Inimigos)
```sql
CREATE TABLE enemies (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type VARCHAR(50) NOT NULL,  -- zombie, skeleton, boss, etc.
  name VARCHAR(100) NOT NULL,
  
  -- Posição
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  chunk_x INT NOT NULL,
  chunk_y INT NOT NULL,
  
  -- Stats
  health INT NOT NULL,
  max_health INT NOT NULL,
  damage INT NOT NULL,
  defense INT NOT NULL,
  speed FLOAT NOT NULL,
  
  -- Level
  level INT NOT NULL DEFAULT 1,
  experience_drop INT NOT NULL DEFAULT 0,
  
  -- Comportamento
  aggro_range FLOAT NOT NULL DEFAULT 10.0,
  is_aggressive BOOLEAN DEFAULT TRUE,
  
  -- Status
  is_alive BOOLEAN DEFAULT TRUE,
  respawn_time INT,  -- segundos
  last_death_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX IDX_ENEMIES_CHUNK (chunk_x, chunk_y),
  INDEX IDX_ENEMIES_TYPE (type),
  INDEX IDX_ENEMIES_ALIVE (is_alive),
  INDEX IDX_ENEMIES_LEVEL (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### buildings (Construções)
```sql
CREATE TABLE buildings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  player_id VARCHAR(36),  -- NULL se for construção do jogo
  type VARCHAR(50) NOT NULL,  -- house, wall, turret, trap, etc.
  name VARCHAR(100),
  
  -- Posição
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  chunk_x INT NOT NULL,
  chunk_y INT NOT NULL,
  
  -- Dimensões
  width FLOAT NOT NULL,
  height FLOAT NOT NULL,
  
  -- Stats
  health INT NOT NULL,
  max_health INT NOT NULL,
  defense INT NOT NULL DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_destructible BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  destroyed_at TIMESTAMP NULL,
  
  INDEX IDX_BUILDINGS_PLAYER (player_id),
  INDEX IDX_BUILDINGS_CHUNK (chunk_x, chunk_y),
  INDEX IDX_BUILDINGS_TYPE (type),
  INDEX IDX_BUILDINGS_ACTIVE (is_active),
  
  FOREIGN KEY FK_BUILDINGS_PLAYERS (player_id) 
    REFERENCES players(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. Sistema de Chunks (Mapa)

#### chunks (Chunks do Mapa - 32x32)
```sql
CREATE TABLE chunks (
  chunk_x INT NOT NULL,
  chunk_y INT NOT NULL,
  
  -- Geração procedural
  seed VARCHAR(100),
  biome VARCHAR(50),  -- forest, desert, snow, hell, etc.
  difficulty INT NOT NULL DEFAULT 1,
  
  -- Entidades no chunk
  player_count INT DEFAULT 0,
  enemy_count INT DEFAULT 0,
  building_count INT DEFAULT 0,
  
  -- Status
  is_generated BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,  -- Tem players?
  last_active_at TIMESTAMP NULL,
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (chunk_x, chunk_y),
  INDEX IDX_CHUNKS_BIOME (biome),
  INDEX IDX_CHUNKS_ACTIVE (is_active),
  INDEX IDX_CHUNKS_LAST_ACTIVE (last_active_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### chunk_resources (Recursos nos Chunks)
```sql
CREATE TABLE chunk_resources (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  chunk_x INT NOT NULL,
  chunk_y INT NOT NULL,
  
  resource_type VARCHAR(50) NOT NULL,  -- wood, stone, iron, etc.
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  quantity INT NOT NULL DEFAULT 100,
  
  -- Status
  is_depleted BOOLEAN DEFAULT FALSE,
  respawn_time INT,  -- segundos
  last_harvested_at TIMESTAMP NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX IDX_CHUNK_RESOURCES_CHUNK (chunk_x, chunk_y),
  INDEX IDX_CHUNK_RESOURCES_TYPE (resource_type),
  INDEX IDX_CHUNK_RESOURCES_DEPLETED (is_depleted),
  
  FOREIGN KEY FK_CHUNK_RESOURCES_CHUNKS (chunk_x, chunk_y) 
    REFERENCES chunks(chunk_x, chunk_y) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 4. Sistema de Inventário e Items

#### items (Items do Jogo)
```sql
CREATE TABLE items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  code VARCHAR(50) NOT NULL UNIQUE,  -- SWORD_IRON, POTION_HEALTH, etc.
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,  -- weapon, armor, consumable, resource, etc.
  
  -- Atributos
  damage INT DEFAULT 0,
  defense INT DEFAULT 0,
  healing INT DEFAULT 0,
  weight FLOAT DEFAULT 0,
  
  -- Raridade
  rarity VARCHAR(20) DEFAULT 'common',  -- common, uncommon, rare, epic, legendary
  
  -- Status
  is_stackable BOOLEAN DEFAULT FALSE,
  max_stack INT DEFAULT 1,
  is_tradeable BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX IDX_ITEMS_CODE (code),
  INDEX IDX_ITEMS_CATEGORY (category),
  INDEX IDX_ITEMS_RARITY (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### player_inventories (Inventário dos Jogadores)
```sql
CREATE TABLE player_inventories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  player_id VARCHAR(36) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  slot_index INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  
  -- Atributos dinâmicos (items encantados, etc)
  durability INT,
  enchantments JSON,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY UK_PLAYER_SLOT (player_id, slot_index),
  INDEX IDX_PLAYER_INVENTORIES_PLAYER (player_id),
  INDEX IDX_PLAYER_INVENTORIES_ITEM (item_id),
  
  FOREIGN KEY FK_PLAYER_INVENTORIES_PLAYERS (player_id) 
    REFERENCES players(id) ON DELETE CASCADE,
  FOREIGN KEY FK_PLAYER_INVENTORIES_ITEMS (item_id) 
    REFERENCES items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. Sistema de Combat e Damage Logs

#### combat_logs (Logs de Combate)
```sql
CREATE TABLE combat_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  
  -- Atacante
  attacker_type VARCHAR(20) NOT NULL,  -- player, enemy, npc
  attacker_id VARCHAR(36) NOT NULL,
  
  -- Alvo
  target_type VARCHAR(20) NOT NULL,  -- player, enemy, npc, building
  target_id VARCHAR(36) NOT NULL,
  
  -- Dados do ataque
  damage INT NOT NULL,
  damage_type VARCHAR(30),  -- physical, fire, ice, poison, etc.
  is_critical BOOLEAN DEFAULT FALSE,
  weapon_used VARCHAR(50),
  
  -- Contexto
  chunk_x INT,
  chunk_y INT,
  
  occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX IDX_COMBAT_LOGS_ATTACKER (attacker_type, attacker_id),
  INDEX IDX_COMBAT_LOGS_TARGET (target_type, target_id),
  INDEX IDX_COMBAT_LOGS_CHUNK (chunk_x, chunk_y),
  INDEX IDX_COMBAT_LOGS_DATE (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- Particionamento por data (opcional para grandes volumes)
PARTITION BY RANGE (TO_DAYS(occurred_at)) (
  PARTITION p_past VALUES LESS THAN (TO_DAYS('2025-01-01')),
  PARTITION p_2025_q1 VALUES LESS THAN (TO_DAYS('2025-04-01')),
  PARTITION p_2025_q2 VALUES LESS THAN (TO_DAYS('2025-07-01')),
  PARTITION p_2025_q3 VALUES LESS THAN (TO_DAYS('2025-10-01')),
  PARTITION p_2025_q4 VALUES LESS THAN (TO_DAYS('2026-01-01')),
  PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

## 🚀 STORED PROCEDURES (Otimização de Latência)

### 1. Get Player Data (Query Recorrente)
```sql
DELIMITER $$

CREATE PROCEDURE sp_get_player_full_data(
  IN p_player_id VARCHAR(36)
)
BEGIN
  -- Player básico
  SELECT 
    p.*,
    u.username,
    u.email
  FROM players p
  INNER JOIN users u ON p.user_id = u.id
  WHERE p.id = p_player_id;
  
  -- Inventário
  SELECT 
    pi.id,
    pi.slot_index,
    pi.quantity,
    pi.durability,
    i.code,
    i.name,
    i.category,
    i.rarity
  FROM player_inventories pi
  INNER JOIN items i ON pi.item_id = i.id
  WHERE pi.player_id = p_player_id
  ORDER BY pi.slot_index;
  
  -- Stats do chunk atual
  SELECT 
    chunk_x,
    chunk_y,
    biome,
    difficulty,
    player_count,
    enemy_count
  FROM chunks
  WHERE chunk_x = (SELECT chunk_x FROM players WHERE id = p_player_id)
    AND chunk_y = (SELECT chunk_y FROM players WHERE id = p_player_id);
END$$

DELIMITER ;
```

### 2. Get Chunk Entities (Query Recorrente)
```sql
DELIMITER $$

CREATE PROCEDURE sp_get_chunk_entities(
  IN p_chunk_x INT,
  IN p_chunk_y INT
)
BEGIN
  -- Players no chunk
  SELECT 
    id, 
    name, 
    position_x, 
    position_y, 
    level,
    health,
    max_health,
    'player' as entity_type
  FROM players
  WHERE chunk_x = p_chunk_x AND chunk_y = p_chunk_y AND is_online = TRUE;
  
  -- Enemies no chunk
  SELECT 
    id, 
    name, 
    type,
    position_x, 
    position_y, 
    level,
    health,
    max_health,
    'enemy' as entity_type
  FROM enemies
  WHERE chunk_x = p_chunk_x AND chunk_y = p_chunk_y AND is_alive = TRUE;
  
  -- NPCs no chunk
  SELECT 
    id, 
    name, 
    type,
    position_x, 
    position_y, 
    'npc' as entity_type
  FROM npcs
  WHERE chunk_x = p_chunk_x AND chunk_y = p_chunk_y AND is_active = TRUE;
  
  -- Buildings no chunk
  SELECT 
    id, 
    type,
    position_x, 
    position_y, 
    width,
    height,
    health,
    max_health,
    'building' as entity_type
  FROM buildings
  WHERE chunk_x = p_chunk_x AND chunk_y = p_chunk_y AND is_active = TRUE;
  
  -- Resources no chunk
  SELECT 
    id,
    resource_type,
    position_x,
    position_y,
    quantity,
    'resource' as entity_type
  FROM chunk_resources
  WHERE chunk_x = p_chunk_x AND chunk_y = p_chunk_y AND is_depleted = FALSE;
END$$

DELIMITER ;
```

### 3. Update Player Position (Query Frequente)
```sql
DELIMITER $$

CREATE PROCEDURE sp_update_player_position(
  IN p_player_id VARCHAR(36),
  IN p_position_x FLOAT,
  IN p_position_y FLOAT
)
BEGIN
  DECLARE v_old_chunk_x INT;
  DECLARE v_old_chunk_y INT;
  DECLARE v_new_chunk_x INT;
  DECLARE v_new_chunk_y INT;
  
  -- Chunk atual
  SELECT chunk_x, chunk_y 
  INTO v_old_chunk_x, v_old_chunk_y
  FROM players 
  WHERE id = p_player_id;
  
  -- Calcular novo chunk (32x32)
  SET v_new_chunk_x = FLOOR(p_position_x / 32);
  SET v_new_chunk_y = FLOOR(p_position_y / 32);
  
  -- Atualizar posição
  UPDATE players 
  SET 
    position_x = p_position_x,
    position_y = p_position_y,
    chunk_x = v_new_chunk_x,
    chunk_y = v_new_chunk_y,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = p_player_id;
  
  -- Se mudou de chunk, atualizar contadores
  IF v_old_chunk_x != v_new_chunk_x OR v_old_chunk_y != v_new_chunk_y THEN
    -- Decrementar chunk antigo
    UPDATE chunks 
    SET player_count = player_count - 1 
    WHERE chunk_x = v_old_chunk_x AND chunk_y = v_old_chunk_y;
    
    -- Incrementar chunk novo
    UPDATE chunks 
    SET 
      player_count = player_count + 1,
      is_active = TRUE,
      last_active_at = CURRENT_TIMESTAMP
    WHERE chunk_x = v_new_chunk_x AND chunk_y = v_new_chunk_y;
    
    -- Retornar indicador de mudança de chunk
    SELECT 1 as changed_chunk, v_new_chunk_x as chunk_x, v_new_chunk_y as chunk_y;
  ELSE
    SELECT 0 as changed_chunk;
  END IF;
END$$

DELIMITER ;
```

### 4. Combat Damage (Query Transacional)
```sql
DELIMITER $$

CREATE PROCEDURE sp_apply_damage(
  IN p_attacker_type VARCHAR(20),
  IN p_attacker_id VARCHAR(36),
  IN p_target_type VARCHAR(20),
  IN p_target_id VARCHAR(36),
  IN p_damage INT,
  IN p_damage_type VARCHAR(30),
  IN p_is_critical BOOLEAN,
  IN p_weapon_used VARCHAR(50)
)
BEGIN
  DECLARE v_current_health INT;
  DECLARE v_chunk_x INT;
  DECLARE v_chunk_y INT;
  
  START TRANSACTION;
  
  -- Aplicar dano dependendo do tipo de alvo
  IF p_target_type = 'player' THEN
    UPDATE players 
    SET health = GREATEST(0, health - p_damage)
    WHERE id = p_target_id;
    
    SELECT health, chunk_x, chunk_y 
    INTO v_current_health, v_chunk_x, v_chunk_y
    FROM players 
    WHERE id = p_target_id;
    
  ELSEIF p_target_type = 'enemy' THEN
    UPDATE enemies 
    SET health = GREATEST(0, health - p_damage)
    WHERE id = p_target_id;
    
    SELECT health, chunk_x, chunk_y 
    INTO v_current_health, v_chunk_x, v_chunk_y
    FROM enemies 
    WHERE id = p_target_id;
    
    -- Se morreu, marcar
    IF v_current_health <= 0 THEN
      UPDATE enemies 
      SET 
        is_alive = FALSE,
        last_death_at = CURRENT_TIMESTAMP
      WHERE id = p_target_id;
    END IF;
    
  ELSEIF p_target_type = 'building' THEN
    UPDATE buildings 
    SET health = GREATEST(0, health - p_damage)
    WHERE id = p_target_id;
    
    SELECT health, chunk_x, chunk_y 
    INTO v_current_health, v_chunk_x, v_chunk_y
    FROM buildings 
    WHERE id = p_target_id;
    
    -- Se destruída
    IF v_current_health <= 0 THEN
      UPDATE buildings 
      SET 
        is_active = FALSE,
        destroyed_at = CURRENT_TIMESTAMP
      WHERE id = p_target_id;
    END IF;
  END IF;
  
  -- Registrar log de combate
  INSERT INTO combat_logs (
    attacker_type, attacker_id,
    target_type, target_id,
    damage, damage_type,
    is_critical, weapon_used,
    chunk_x, chunk_y
  ) VALUES (
    p_attacker_type, p_attacker_id,
    p_target_type, p_target_id,
    p_damage, p_damage_type,
    p_is_critical, p_weapon_used,
    v_chunk_x, v_chunk_y
  );
  
  COMMIT;
  
  -- Retornar resultado
  SELECT 
    v_current_health as current_health,
    v_current_health <= 0 as is_dead;
END$$

DELIMITER ;
```

---

## 📊 INDEXES ESTRATÉGICOS

### Indexes de Performance Crítica

```sql
-- Players: busca por chunk (muito frequente)
CREATE INDEX IDX_PLAYERS_CHUNK_ONLINE 
ON players(chunk_x, chunk_y, is_online);

-- Combat logs: busca por data e chunk
CREATE INDEX IDX_COMBAT_LOGS_CHUNK_DATE 
ON combat_logs(chunk_x, chunk_y, occurred_at);

-- Inventories: busca por player e slot
CREATE INDEX IDX_INVENTORIES_PLAYER_SLOT 
ON player_inventories(player_id, slot_index);

-- Chunks: busca por atividade
CREATE INDEX IDX_CHUNKS_ACTIVE_LAST 
ON chunks(is_active, last_active_at);
```

---

## 🔧 FUNCTIONS UTILITÁRIAS

### Calcular Distância entre Entidades
```sql
DELIMITER $$

CREATE FUNCTION fn_calculate_distance(
  x1 FLOAT, y1 FLOAT, 
  x2 FLOAT, y2 FLOAT
) RETURNS FLOAT
DETERMINISTIC
BEGIN
  RETURN SQRT(POW(x2 - x1, 2) + POW(y2 - y1, 2));
END$$

DELIMITER ;
```

### Calcular Chunk de Posição
```sql
DELIMITER $$

CREATE FUNCTION fn_position_to_chunk(
  position FLOAT
) RETURNS INT
DETERMINISTIC
BEGIN
  RETURN FLOOR(position / 32);
END$$

DELIMITER ;
```

---

## ⚡ OTIMIZAÇÃO DE LATÊNCIA

### Estratégias Implementadas

1. **Stored Procedures** - Queries recorrentes executadas no servidor MySQL
   - Reduz roundtrips network
   - Processamento mais rápido
   - Menos overhead de parsing

2. **Indexes Compostos** - Otimizam queries com múltiplas condições
   - chunk_x + chunk_y + is_online
   - Evita table scans

3. **Particionamento** - Divide tabelas grandes
   - Combat logs por data
   - Chunks por região (futuro)

4. **Connection Pooling** - Reutiliza conexões
   - Configurado no TypeORM/NestJS
   - Pool size: 10-20 conexões

5. **Query Caching** - Cache de queries frequentes
   - Configurado no MySQL
   - TTL: 60 segundos para dados hot

---

## 📈 MONITORAMENTO E PERFORMANCE

### Queries Lentas (Slow Query Log)
```sql
-- Habilitar slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 1 segundo
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow-query.log';
```

### Análise de Performance
```sql
-- Ver queries lentas
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- EXPLAIN de query suspeita
EXPLAIN SELECT * FROM players WHERE chunk_x = 10 AND chunk_y = 20;
```

### Estatísticas de Tabelas
```sql
-- Ver tamanho das tabelas
SELECT 
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
  table_rows
FROM information_schema.TABLES
WHERE table_schema = 'hells_december'
ORDER BY (data_length + index_length) DESC;
```

---

## ✅ CHECKLIST DE DESENVOLVIMENTO

### Para cada nova tabela:
- [ ] Seguir nomenclatura snake_case
- [ ] Usar UUID para PKs
- [ ] Adicionar created_at e updated_at
- [ ] Criar indexes para colunas de busca
- [ ] Adicionar foreign keys apropriadas
- [ ] Definir charset utf8mb4
- [ ] Documentar propósito da tabela

### Para queries recorrentes:
- [ ] Criar stored procedure
- [ ] Testar performance com EXPLAIN
- [ ] Adicionar indexes necessários
- [ ] Documentar parâmetros e retorno
- [ ] Versionar no sistema de migrations

### Antes de deploy:
- [ ] Rodar migrations
- [ ] Testar stored procedures
- [ ] Verificar indexes criados
- [ ] Analisar slow query log
- [ ] Validar foreign keys
- [ ] Backup do banco

---

## 🚫 ANTI-PATTERNS A EVITAR

❌ **NUNCA:**
- Usar SELECT * em produção
- Criar tabelas sem indexes de busca
- Ignorar stored procedures para queries recorrentes
- Usar VARCHAR(255) para tudo (otimizar tamanhos)
- N+1 queries (usar JOINs ou stored procedures)
- Ignorar particionamento em tabelas grandes
- Deixar conexões abertas sem pool

✅ **SEMPRE:**
- Usar stored procedures para queries recorrentes
- Criar indexes estratégicos
- Otimizar com EXPLAIN
- Usar transactions para operações críticas
- Monitorar slow query log
- Particionar tabelas grandes (logs, chunks)
- Connection pooling configurado

---

## 📚 COMANDOS ÚTEIS

```bash
# Conectar ao MySQL
mysql -u root -p hells_december

# Backup
mysqldump -u root -p hells_december > backup.sql

# Restore
mysql -u root -p hells_december < backup.sql

# Ver stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'hells_december';

# Ver indexes de uma tabela
SHOW INDEX FROM players;

# Otimizar tabela
OPTIMIZE TABLE players;
```

---

**Última atualização:** 29/10/2025  
**Responsável:** Arquitetura Database - Hell's December
