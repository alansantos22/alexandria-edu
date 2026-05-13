-- ============================================================
-- Migration 019 - Commerce: Products
-- Produtos vendáveis (cursos, webinars, aulas avulsas, bundles).
-- ============================================================

USE alexandria_edu;

-- 1) products ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id                    VARCHAR(36)  NOT NULL PRIMARY KEY DEFAULT (UUID()),
  slug                  VARCHAR(160) NOT NULL UNIQUE,
  name                  VARCHAR(255) NOT NULL,
  description           TEXT         NULL,
  thumbnail_url         VARCHAR(500) NULL,

  -- Tipo / Kind
  kind                  ENUM('course','live_pack','webinar','bundle') NOT NULL DEFAULT 'course',

  -- Preço
  price_brl             DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_free               BOOLEAN       NOT NULL DEFAULT FALSE,
  allow_coins           BOOLEAN       NOT NULL DEFAULT FALSE,
  coins_max_percent     DECIMAL(5,2)  NOT NULL DEFAULT 0.00,   -- 0..100 (% do BRL que pode ser pago em moedas)
  coins_rate            DECIMAL(10,4) NOT NULL DEFAULT 1.0000, -- coins por R$ 1,00

  -- Acesso
  access_duration_days  INT           NOT NULL DEFAULT 365,
  lessons_quota         INT           NULL,                    -- NULL = ilimitado

  -- Fuso e capacidade default
  timezone              VARCHAR(64)   NOT NULL DEFAULT 'America/Sao_Paulo',
  default_capacity      INT           NULL,                    -- usado como default ao criar cohort

  is_published          BOOLEAN       NOT NULL DEFAULT FALSE,
  created_by            VARCHAR(36)   NULL,
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_creator FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP PROCEDURE IF EXISTS m019_idx;
CREATE PROCEDURE m019_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND INDEX_NAME='IDX_PRODUCTS_PUBLISHED') THEN
    CREATE INDEX IDX_PRODUCTS_PUBLISHED ON products (is_published);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='products' AND INDEX_NAME='IDX_PRODUCTS_KIND') THEN
    CREATE INDEX IDX_PRODUCTS_KIND ON products (kind);
  END IF;
END;
CALL m019_idx();
DROP PROCEDURE IF EXISTS m019_idx;

-- 2) product_courses (bundle: produto contém 1..N cursos pedagógicos) -------
CREATE TABLE IF NOT EXISTS product_courses (
  id          VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  product_id  VARCHAR(36) NOT NULL,
  course_id   VARCHAR(36) NOT NULL,
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_pc_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_course  FOREIGN KEY (course_id)  REFERENCES courses  (id) ON DELETE CASCADE,
  CONSTRAINT uq_pc UNIQUE (product_id, course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) registrar ---------------------------------------------------------------
INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('019-commerce-products.sql', NOW(), 'applied');
