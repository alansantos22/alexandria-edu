-- ============================================================
-- Migration 020 - Cohorts (Turmas)
-- Permite separar um produto em múltiplas turmas com capacidade.
-- ============================================================

USE alexandria_edu;

CREATE TABLE IF NOT EXISTS cohorts (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  product_id   VARCHAR(36)  NOT NULL,
  name         VARCHAR(160) NOT NULL,
  capacity     INT          NULL,                       -- NULL = sem limite
  timezone     VARCHAR(64)  NOT NULL DEFAULT 'America/Sao_Paulo',
  starts_at    TIMESTAMP    NULL,
  ends_at      TIMESTAMP    NULL,
  status       ENUM('draft','open','closed','running','finished','cancelled') NOT NULL DEFAULT 'draft',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_cohort_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m020_idx;
CREATE PROCEDURE m020_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cohorts' AND INDEX_NAME='IDX_COHORTS_PRODUCT') THEN
    CREATE INDEX IDX_COHORTS_PRODUCT ON cohorts (product_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='cohorts' AND INDEX_NAME='IDX_COHORTS_STATUS') THEN
    CREATE INDEX IDX_COHORTS_STATUS ON cohorts (status);
  END IF;
END;
CALL m020_idx();
DROP PROCEDURE IF EXISTS m020_idx;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('020-cohorts.sql', NOW(), 'applied');
