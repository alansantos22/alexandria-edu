-- ============================================================
-- Migration 003 - Profile System
-- Tabelas: badges, user_badges, cards, user_cards, tracks, modules
-- + ALTER TABLE lessons ADD COLUMN module_id (condicional)
-- Padrão: MySQL-safe (sem ADD COLUMN IF NOT EXISTS,
--          sem prepared statements complexos)
-- ============================================================

USE alexandria_edu;

-- ── 1. Tabela badges (catálogo global de medalhas) ───────────
CREATE TABLE IF NOT EXISTS badges (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  icon        VARCHAR(10)  NOT NULL DEFAULT '🏅',
  rarity      ENUM('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
  xp_reward   INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_BADGES_CODE (code),
  INDEX IDX_BADGES_RARITY (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Tabela user_badges (pivot usuário ↔ medalha) ──────────
CREATE TABLE IF NOT EXISTS user_badges (
  id         VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id    VARCHAR(36) NOT NULL,
  badge_id   VARCHAR(36) NOT NULL,
  awarded_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_USER_BADGE (user_id, badge_id),
  INDEX IDX_USER_BADGE_USER  (user_id),
  INDEX IDX_USER_BADGE_BADGE (badge_id),
  CONSTRAINT FK_USER_BADGE_USER  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT FK_USER_BADGE_BADGE FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Tabela cards (catálogo global de cartas colecionáveis) ─
CREATE TABLE IF NOT EXISTS cards (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description VARCHAR(500) NULL,
  art_url     VARCHAR(500) NULL,
  rarity      ENUM('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
  event_name  VARCHAR(255) NULL COMMENT 'Nome do evento de origem (POAP)',
  dropped_at  TIMESTAMP    NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_CARDS_CODE (code),
  INDEX IDX_CARDS_RARITY (rarity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Tabela user_cards (pivot usuário ↔ carta) ─────────────
CREATE TABLE IF NOT EXISTS user_cards (
  id          VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id     VARCHAR(36) NOT NULL,
  card_id     VARCHAR(36) NOT NULL,
  quantity    INT         NOT NULL DEFAULT 1,
  acquired_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_USER_CARD (user_id, card_id),
  INDEX IDX_USER_CARD_USER (user_id),
  INDEX IDX_USER_CARD_CARD (card_id),
  CONSTRAINT FK_USER_CARD_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT FK_USER_CARD_CARD FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. Tabela tracks (trilhas de aprendizado) ─────────────────
CREATE TABLE IF NOT EXISTS tracks (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NULL,
  icon        VARCHAR(10)  NOT NULL DEFAULT '📚',
  order_index INT          NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_TRACKS_CODE (code),
  INDEX IDX_TRACKS_ORDER  (order_index),
  INDEX IDX_TRACKS_ACTIVE (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. Tabela modules (módulos dentro de trilhas) ─────────────
CREATE TABLE IF NOT EXISTS modules (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  track_id    VARCHAR(36)  NOT NULL,
  code        VARCHAR(100) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NULL,
  order_index INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_MODULE_CODE (code),
  INDEX IDX_MODULE_TRACK (track_id),
  INDEX IDX_MODULE_ORDER (order_index),
  CONSTRAINT FK_MODULE_TRACK FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. Adicionar module_id em lessons (condicional) ───────────
-- Verificação via INFORMATION_SCHEMA (MySQL não suporta ADD COLUMN IF NOT EXISTS)
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'lessons'
    AND COLUMN_NAME  = 'module_id'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE lessons ADD COLUMN module_id VARCHAR(36) NULL',
  'SELECT ''module_id already exists, skipping'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 8. Seed: badges de exemplo ────────────────────────────────
INSERT IGNORE INTO badges (code, name, description, icon, rarity, xp_reward) VALUES
  ('FIRST_LESSON',  'Primeira Aula',      'Completou sua primeira aula na Alexandria.',    '📖', 'common',     50),
  ('STREAK_7',      'Semana Perfeita',    'Manteve 7 dias consecutivos de estudo.',         '🔥', 'rare',      100),
  ('QUIZ_MASTER',   'Mestre dos Quizzes', 'Acertou 90%+ em 5 avaliações distintas.',        '🎯', 'epic',      250),
  ('FOUNDER',       'Cidadão Fundador',   'Membro da turma de lançamento da Alexandria.',   '🌟', 'legendary', 500);

-- ── 9. Seed: cartas de exemplo ────────────────────────────────
INSERT IGNORE INTO cards (code, name, description, rarity, event_name, dropped_at) VALUES
  ('FOUNDER_CARD',     'Carta do Fundador',     'Emitida na abertura da Alexandria. Exclusiva para membros fundadores.', 'legendary', 'Lançamento Alexandria EDU',              NOW()),
  ('WEBINAR_AI_APR26', 'Webinar IA — Abr/2026', 'POAP do Webinar de IA Generativa de Abril/2026.',                      'epic',      'Webinar IA Generativa Abr/2026',         NOW()),
  ('FIRST_STEPS',      'Primeiros Passos',       'Distribuída ao completar o onboarding da plataforma.',                 'common',    NULL,                                     NULL);

-- ── 10. Seed: trilha + módulo de exemplo ──────────────────────
INSERT IGNORE INTO tracks (code, name, description, icon, order_index) VALUES
  ('FUNDAMENTOS', 'Fundamentos', 'Trilha inicial para novos membros da Alexandria.', '🚀', 1);

INSERT IGNORE INTO modules (code, track_id, name, description, order_index)
SELECT 'FUNDAMENTOS_INTRO', id, 'Módulo Introdutório', 'Primeiros passos na plataforma Alexandria.', 1
FROM tracks
WHERE code = 'FUNDAMENTOS'
LIMIT 1;
