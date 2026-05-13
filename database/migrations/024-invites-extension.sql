-- ============================================================
-- Migration 024 - Invites + Discount Coupons (estende vouchers)
-- Unifica:
--   - kind=access   → libera acesso a um escopo (produto/turma/aula)
--   - kind=discount → cupom de desconto (% ou fixo) em produtos
-- ============================================================

USE alexandria_edu;

DROP PROCEDURE IF EXISTS m024_extend;
CREATE PROCEDURE m024_extend()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND COLUMN_NAME='kind') THEN
    ALTER TABLE vouchers ADD COLUMN kind ENUM('access','discount') NOT NULL DEFAULT 'access' AFTER label;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND COLUMN_NAME='scope') THEN
    ALTER TABLE vouchers ADD COLUMN scope ENUM('global','product','cohort','live_class') NOT NULL DEFAULT 'global' AFTER kind;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND COLUMN_NAME='scope_id') THEN
    ALTER TABLE vouchers ADD COLUMN scope_id VARCHAR(36) NULL AFTER scope;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND COLUMN_NAME='discount_kind') THEN
    ALTER TABLE vouchers ADD COLUMN discount_kind ENUM('percent','fixed') NULL AFTER scope_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND COLUMN_NAME='discount_percent') THEN
    ALTER TABLE vouchers ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER discount_kind;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND COLUMN_NAME='discount_amount') THEN
    ALTER TABLE vouchers ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER discount_percent;
  END IF;
END;
CALL m024_extend();
DROP PROCEDURE IF EXISTS m024_extend;

DROP PROCEDURE IF EXISTS m024_idx;
CREATE PROCEDURE m024_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND INDEX_NAME='IDX_VOUCHER_SCOPE') THEN
    CREATE INDEX IDX_VOUCHER_SCOPE ON vouchers (scope, scope_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='vouchers' AND INDEX_NAME='IDX_VOUCHER_KIND') THEN
    CREATE INDEX IDX_VOUCHER_KIND ON vouchers (kind);
  END IF;
END;
CALL m024_idx();
DROP PROCEDURE IF EXISTS m024_idx;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('024-invites-extension.sql', NOW(), 'applied');
