-- ============================================================
-- Migration 001 - Economy System (Token Economy)
-- Adiciona: coins_balance em users, coin_transactions,
--           coin_rewards_config
-- Padrão: Verificação via INFORMATION_SCHEMA (MySQL safe)
-- ============================================================

USE alexandria_edu;

-- ── 1. Adicionar coins_balance à tabela users ────────────────
-- Verificação manual antes de ALTER (MySQL não suporta ADD COLUMN IF NOT EXISTS)
SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'users'
    AND COLUMN_NAME  = 'coins_balance'
);

SET @sql = IF(
  @col_exists = 0,
  'ALTER TABLE users ADD COLUMN coins_balance INT NOT NULL DEFAULT 0',
  'SELECT ''coins_balance already exists, skipping'' AS info'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 2. Tabela coin_transactions ──────────────────────────────
CREATE TABLE IF NOT EXISTS coin_transactions (
  id          VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id     VARCHAR(36)  NOT NULL,
  delta       INT          NOT NULL COMMENT 'Positivo = crédito, Negativo = débito',
  balance_after INT        NOT NULL DEFAULT 0,
  event_type  VARCHAR(50)  NOT NULL
    COMMENT 'LESSON_COMPLETE | QUIZ_PASS_70 | QUIZ_PASS_90 | DAILY_STREAK | COURSE_PURCHASE_CASHBACK | MARKETPLACE_PURCHASE',
  reference_id VARCHAR(36) NULL     COMMENT 'ID da lição, quiz, item, etc.',
  description VARCHAR(255) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_COIN_TX_USER    (user_id),
  INDEX IDX_COIN_TX_EVENT   (event_type),
  INDEX IDX_COIN_TX_CREATED (created_at),
  CONSTRAINT FK_COIN_TX_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Tabela coin_rewards_config ────────────────────────────
CREATE TABLE IF NOT EXISTS coin_rewards_config (
  event_type  VARCHAR(50)  NOT NULL,
  coins       INT          NOT NULL DEFAULT 0,
  description VARCHAR(255) NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. Seed da configuração de recompensas ───────────────────
INSERT INTO coin_rewards_config (event_type, coins, description) VALUES
  ('LESSON_COMPLETE',          10,  'Completar uma aula'),
  ('QUIZ_PASS_70',             15,  'Nota ≥ 70% numa avaliação'),
  ('QUIZ_PASS_90',             25,  'Nota ≥ 90% numa avaliação (bônus elite)'),
  ('DAILY_STREAK',              5,  'Manter streak diário de estudos'),
  ('COURSE_PURCHASE_CASHBACK', 50,  'Cashback ao adquirir acesso à plataforma')
ON DUPLICATE KEY UPDATE coins = VALUES(coins), description = VALUES(description);
