-- ============================================================
-- Migration 010 - Vouchers de Acesso
-- Cria: tabela vouchers
-- Padrao: idempotente via CREATE TABLE IF NOT EXISTS + procedure
-- ============================================================

USE alexandria_edu;

-- ---------------------------------------------------------------------------
-- 1. Criar tabela vouchers
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vouchers (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  code         VARCHAR(20)  NOT NULL UNIQUE,
  label        VARCHAR(120) NULL,
  max_uses     INT          NOT NULL DEFAULT 1,
  current_uses INT          NOT NULL DEFAULT 0,
  access_days  INT          NOT NULL DEFAULT 30,
  expires_at   TIMESTAMP    NULL DEFAULT NULL,
  created_by   VARCHAR(36)  NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_voucher_creator
    FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indices (idempotente via procedure)
DROP PROCEDURE IF EXISTS migration_010_voucher_idx;

CREATE PROCEDURE migration_010_voucher_idx()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'vouchers'
      AND INDEX_NAME   = 'IDX_VOUCHER_CODE'
  ) THEN
    CREATE INDEX IDX_VOUCHER_CODE ON vouchers (code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'vouchers'
      AND INDEX_NAME   = 'IDX_VOUCHER_EXPIRES'
  ) THEN
    CREATE INDEX IDX_VOUCHER_EXPIRES ON vouchers (expires_at);
  END IF;
END;

CALL migration_010_voucher_idx();
DROP PROCEDURE IF EXISTS migration_010_voucher_idx;

-- ---------------------------------------------------------------------------
-- 2. Tabela de redenção (audit trail)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS voucher_uses (
  id         VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  voucher_id VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  used_at    TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_vuse_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers (id) ON DELETE CASCADE,
  CONSTRAINT fk_vuse_user    FOREIGN KEY (user_id)    REFERENCES users    (id) ON DELETE CASCADE,
  CONSTRAINT uq_vuse_user    UNIQUE (voucher_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. Coluna voucher_access_until em users (idempotente via procedure)
-- ---------------------------------------------------------------------------

DROP PROCEDURE IF EXISTS migration_010_add_voucher_col;

CREATE PROCEDURE migration_010_add_voucher_col()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'users'
      AND COLUMN_NAME  = 'voucher_access_until'
  ) THEN
    ALTER TABLE users
      ADD COLUMN voucher_access_until TIMESTAMP NULL DEFAULT NULL
      AFTER is_active;
  END IF;
END;

CALL migration_010_add_voucher_col();
DROP PROCEDURE IF EXISTS migration_010_add_voucher_col;

-- ---------------------------------------------------------------------------
-- 4. Registrar migration
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('010-vouchers.sql', NOW(), 'applied');

