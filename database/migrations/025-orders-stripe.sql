-- ============================================================
-- Migration 025 - Orders + Payment Intents (Stripe)
-- Pedidos + integração com Stripe (PI ids + webhook events).
-- ============================================================

USE alexandria_edu;

CREATE TABLE IF NOT EXISTS orders (
  id                 VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  user_id            VARCHAR(36)  NOT NULL,
  product_id         VARCHAR(36)  NOT NULL,
  cohort_id          VARCHAR(36)  NULL,

  -- Preço
  list_price_brl     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_brl       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  coins_used         INT          NOT NULL DEFAULT 0,
  coins_value_brl    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  brl_to_pay         DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  voucher_code       VARCHAR(20)  NULL,
  campaign_id        VARCHAR(36)  NULL,

  status             ENUM('pending','awaiting_payment','paid','failed','cancelled','refunded') NOT NULL DEFAULT 'pending',
  payment_method     ENUM('stripe','coins_only','free','admin') NOT NULL DEFAULT 'stripe',

  paid_at            TIMESTAMP    NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_ord_user     FOREIGN KEY (user_id)     REFERENCES users (id)     ON DELETE CASCADE,
  CONSTRAINT fk_ord_product  FOREIGN KEY (product_id)  REFERENCES products (id)  ON DELETE RESTRICT,
  CONSTRAINT fk_ord_cohort   FOREIGN KEY (cohort_id)   REFERENCES cohorts (id)   ON DELETE SET NULL,
  CONSTRAINT fk_ord_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m025_idx;
CREATE PROCEDURE m025_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND INDEX_NAME='IDX_ORD_USER') THEN
    CREATE INDEX IDX_ORD_USER ON orders (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='orders' AND INDEX_NAME='IDX_ORD_STATUS') THEN
    CREATE INDEX IDX_ORD_STATUS ON orders (status);
  END IF;
END;
CALL m025_idx();
DROP PROCEDURE IF EXISTS m025_idx;

CREATE TABLE IF NOT EXISTS payment_intents (
  id                 VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  order_id           VARCHAR(36)  NOT NULL,
  stripe_pi_id       VARCHAR(120) NOT NULL,
  client_secret      VARCHAR(255) NULL,
  status             VARCHAR(40)  NOT NULL DEFAULT 'requires_payment_method',
  amount_brl         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  last_event         VARCHAR(80)  NULL,
  raw_last_event     JSON         NULL,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pi_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT uq_pi_stripe UNIQUE (stripe_pi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('025-orders-stripe.sql', NOW(), 'applied');
