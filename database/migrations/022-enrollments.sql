-- ============================================================
-- Migration 022 - Enrollments (Matrículas)
-- Acesso a produto/turma + expiração + quota.
-- ============================================================

USE alexandria_edu;

CREATE TABLE IF NOT EXISTS enrollments (
  id                 VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id            VARCHAR(36) NOT NULL,
  product_id         VARCHAR(36) NOT NULL,
  cohort_id          VARCHAR(36) NULL,                  -- turma escolhida (null = ainda não atribuído)
  source             ENUM('purchase','invite','admin','free') NOT NULL DEFAULT 'purchase',
  source_ref         VARCHAR(64) NULL,                  -- order_id / voucher code etc.

  granted_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at         TIMESTAMP   NULL,                  -- snapshot baseado em access_duration_days
  lessons_quota      INT         NULL,                  -- snapshot (NULL = ilimitado)
  lessons_consumed   INT         NOT NULL DEFAULT 0,

  status             ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',

  created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_enr_user    FOREIGN KEY (user_id)    REFERENCES users (id)    ON DELETE CASCADE,
  CONSTRAINT fk_enr_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_enr_cohort  FOREIGN KEY (cohort_id)  REFERENCES cohorts (id)  ON DELETE SET NULL,
  CONSTRAINT uq_enr_user_product UNIQUE (user_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m022_idx;
CREATE PROCEDURE m022_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='enrollments' AND INDEX_NAME='IDX_ENR_USER') THEN
    CREATE INDEX IDX_ENR_USER ON enrollments (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='enrollments' AND INDEX_NAME='IDX_ENR_COHORT') THEN
    CREATE INDEX IDX_ENR_COHORT ON enrollments (cohort_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='enrollments' AND INDEX_NAME='IDX_ENR_STATUS') THEN
    CREATE INDEX IDX_ENR_STATUS ON enrollments (status);
  END IF;
END;
CALL m022_idx();
DROP PROCEDURE IF EXISTS m022_idx;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('022-enrollments.sql', NOW(), 'applied');
