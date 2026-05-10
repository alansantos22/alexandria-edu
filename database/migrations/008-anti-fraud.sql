-- ============================================================
-- Migration 008 — Anti-Fraud System
-- Tabela de flags de anomalia de usuários
-- Engine: MySQL 8.0+ / InnoDB
-- ============================================================

USE alexandria_edu;

-- ── 1. USER FLAGS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_flags (
  id           VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id      VARCHAR(36)  NOT NULL,
  flag_type    VARCHAR(50)  NOT NULL,
  detail       TEXT         NULL,
  is_reviewed  BOOLEAN      NOT NULL DEFAULT FALSE,
  reviewed_by  VARCHAR(36)  NULL,
  reviewed_at  TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_FLAG_USER      (user_id),
  INDEX IDX_FLAG_TYPE      (flag_type),
  INDEX IDX_FLAG_REVIEWED  (is_reviewed),
  CONSTRAINT FK_FLAG_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. Adicionar ADMIN_ADJUSTMENT ao enum de coin_transactions ──
-- coin_transactions.event_type é VARCHAR(50), não ENUM — sem necessidade de ALTER.
-- O novo valor 'ADMIN_ADJUSTMENT' será inserido diretamente pelo serviço.

-- ── Registro ─────────────────────────────────────────────────

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('008-anti-fraud.sql', NOW(), 'applied');
