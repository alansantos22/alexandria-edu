-- ============================================================
-- Alexandria EDU - Migration 003: Build Mode
-- Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- ============================================================

USE alexandria_edu;

-- ============================================================
-- CITY PALETTE — admin catalog of buildable items
-- CCU cost defines the render budget cost per placed item.
-- ============================================================
CREATE TABLE IF NOT EXISTS city_palette (
  id           VARCHAR(36)      NOT NULL DEFAULT (UUID()),
  name         VARCHAR(120)     NOT NULL,
  category     ENUM('residential','commercial','nature','road','decoration')
                                NOT NULL DEFAULT 'residential',
  placement    ENUM('grid','free') NOT NULL DEFAULT 'grid',
  ccu_cost     SMALLINT UNSIGNED NOT NULL DEFAULT 10,
  size_x       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  size_z       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  model_url    VARCHAR(512)     NULL,
  price_coins  INT UNSIGNED     NOT NULL DEFAULT 0,
  icon         VARCHAR(10)      NOT NULL DEFAULT '🏠',
  is_active    TINYINT(1)       NOT NULL DEFAULT 1,
  sort_order   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_PALETTE_CATEGORY (category, is_active),
  INDEX IDX_PALETTE_ACTIVE   (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CITY BUILDINGS — user-placed items on their lot
-- Grid coordinates map to world position: x * CELL (1.4 units)
-- ============================================================
CREATE TABLE IF NOT EXISTS city_buildings (
  id              VARCHAR(36)    NOT NULL DEFAULT (UUID()),
  city_user_id    VARCHAR(36)    NOT NULL,
  palette_item_id VARCHAR(36)    NOT NULL,
  grid_x          SMALLINT       NOT NULL,
  grid_z          SMALLINT       NOT NULL,
  rotation        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  placed_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  INDEX IDX_BUILDING_USER (city_user_id),
  CONSTRAINT FK_BUILDING_USER    FOREIGN KEY (city_user_id)    REFERENCES users(id)        ON DELETE CASCADE,
  CONSTRAINT FK_BUILDING_PALETTE FOREIGN KEY (palette_item_id) REFERENCES city_palette(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Extend city_meta with CCU tracking (idempotente)
-- ============================================================
DROP PROCEDURE IF EXISTS migration_003_ccu_columns;
CREATE PROCEDURE migration_003_ccu_columns()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_meta' AND COLUMN_NAME = 'ccu_limit'
  ) THEN
    ALTER TABLE city_meta ADD COLUMN ccu_limit SMALLINT UNSIGNED NOT NULL DEFAULT 2000 AFTER total_buildings;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_meta' AND COLUMN_NAME = 'ccu_used'
  ) THEN
    ALTER TABLE city_meta ADD COLUMN ccu_used SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER ccu_limit;
  END IF;
END;
CALL migration_003_ccu_columns();
DROP PROCEDURE IF EXISTS migration_003_ccu_columns;

-- Seed: Initial palette items (idempotente)
INSERT IGNORE INTO city_palette (id, name, category, placement, ccu_cost, size_x, size_z, price_coins, icon, sort_order) VALUES
  (UUID(), 'Casa Pequena',   'residential', 'grid',  15,  1, 1,   0, '🏠', 1),
  (UUID(), 'Casa Média',     'residential', 'grid',  35,  2, 2, 150, '🏡', 2),
  (UUID(), 'Apartamento',    'residential', 'grid',  70,  2, 3, 400, '🏢', 3),
  (UUID(), 'Loja',           'commercial',  'grid',  25,  1, 1, 200, '🏪', 1),
  (UUID(), 'Mercado',        'commercial',  'grid',  90,  3, 2, 600, '🏬', 2),
  (UUID(), 'Árvore',         'nature',      'free',   5,  1, 1,   0, '🌳', 1),
  (UUID(), 'Parque',         'nature',      'grid',  20,  2, 2, 100, '🌿', 2),
  (UUID(), 'Fonte',          'decoration',  'free',  40,  1, 1, 300, '⛲', 1),
  (UUID(), 'Banco de Praça', 'decoration',  'free',   8,  1, 1,  50, '🪑', 2),
  (UUID(), 'Poste',          'decoration',  'free',   3,  1, 1,   0, '💡', 3);

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('003-build-mode.sql', NOW(), 'applied');
