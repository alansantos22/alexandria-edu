-- ============================================================
-- Migration 009 - Vault de Itens + Tokens de Resgate
-- Adiciona: coluna is_vault em marketplace_items
--           tabela redemption_tokens
-- Padrao: idempotente via INFORMATION_SCHEMA + procedure
-- ============================================================

USE alexandria_edu;

-- ---------------------------------------------------------------------------
-- 1. Adicionar coluna is_vault em marketplace_items (idempotente)
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS migration_009_add_is_vault;

CREATE PROCEDURE migration_009_add_is_vault()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'marketplace_items'
      AND COLUMN_NAME  = 'is_vault'
  ) THEN
    ALTER TABLE marketplace_items
      ADD COLUMN is_vault TINYINT NOT NULL DEFAULT 0
      AFTER is_active;
  END IF;
END;

CALL migration_009_add_is_vault();
DROP PROCEDURE IF EXISTS migration_009_add_is_vault;

-- ---------------------------------------------------------------------------
-- 2. Criar tabela redemption_tokens
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS redemption_tokens (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  code         VARCHAR(20)  NOT NULL UNIQUE,
  item_id      CHAR(36)     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  max_uses     INT          NOT NULL DEFAULT 1,
  current_uses INT          NOT NULL DEFAULT 0,
  expires_at   TIMESTAMP    NULL DEFAULT NULL,
  created_by   VARCHAR(36)  NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_rtoken_item
    FOREIGN KEY (item_id)    REFERENCES marketplace_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_rtoken_creator
    FOREIGN KEY (created_by) REFERENCES users (id)             ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indices (ignora erro se ja existir)
DROP PROCEDURE IF EXISTS migration_009_indexes;

CREATE PROCEDURE migration_009_indexes()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'redemption_tokens'
      AND INDEX_NAME   = 'IDX_RTOKEN_CODE'
  ) THEN
    CREATE INDEX IDX_RTOKEN_CODE ON redemption_tokens (code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'redemption_tokens'
      AND INDEX_NAME   = 'IDX_RTOKEN_ITEM'
  ) THEN
    CREATE INDEX IDX_RTOKEN_ITEM ON redemption_tokens (item_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'redemption_tokens'
      AND INDEX_NAME   = 'IDX_RTOKEN_EXPIRES'
  ) THEN
    CREATE INDEX IDX_RTOKEN_EXPIRES ON redemption_tokens (expires_at);
  END IF;
END;

CALL migration_009_indexes();
DROP PROCEDURE IF EXISTS migration_009_indexes;

-- ---------------------------------------------------------------------------
-- 3. Registrar migration
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('009-vault-and-tokens.sql', NOW(), 'applied');
