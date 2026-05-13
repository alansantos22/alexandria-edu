-- ============================================================
-- Migration 023 - Campaigns (Promoções estilo Udemy)
-- Campanha global ou por slug com 1..N produtos.
-- ============================================================

USE alexandria_edu;

CREATE TABLE IF NOT EXISTS campaigns (
  id                VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  name              VARCHAR(160) NOT NULL,
  public_slug       VARCHAR(160) NOT NULL UNIQUE,        -- /promo/:slug
  description       TEXT         NULL,
  banner_url        VARCHAR(500) NULL,
  badge_text        VARCHAR(60)  NULL,                   -- ex: "-50% OFF"

  kind              ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_percent  DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  discount_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- em BRL (kind=fixed)

  starts_at         TIMESTAMP    NULL,
  ends_at           TIMESTAMP    NULL,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,

  applies_to_all    BOOLEAN      NOT NULL DEFAULT FALSE, -- se TRUE, ignora campaign_products

  created_by        VARCHAR(36)  NULL,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_camp_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m023_idx;
CREATE PROCEDURE m023_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='campaigns' AND INDEX_NAME='IDX_CAMP_ACTIVE') THEN
    CREATE INDEX IDX_CAMP_ACTIVE ON campaigns (is_active);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='campaigns' AND INDEX_NAME='IDX_CAMP_DATES') THEN
    CREATE INDEX IDX_CAMP_DATES ON campaigns (starts_at, ends_at);
  END IF;
END;
CALL m023_idx();
DROP PROCEDURE IF EXISTS m023_idx;

CREATE TABLE IF NOT EXISTS campaign_products (
  id           VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  campaign_id  VARCHAR(36) NOT NULL,
  product_id   VARCHAR(36) NOT NULL,
  created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_cp_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  CONSTRAINT fk_cp_product  FOREIGN KEY (product_id)  REFERENCES products  (id) ON DELETE CASCADE,
  CONSTRAINT uq_cp UNIQUE (campaign_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('023-campaigns.sql', NOW(), 'applied');
