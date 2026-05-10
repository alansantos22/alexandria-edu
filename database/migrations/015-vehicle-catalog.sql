-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 015: Vehicle Catalog (DB-driven)
-- ─────────────────────────────────────────────────────────────────────────────
-- Cria tabela de catálogo de veículos (gerenciada pelo admin) e
-- adiciona coluna catalog_id em user_vehicles para vincular ao veículo comprado.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Catálogo de veículos
CREATE TABLE IF NOT EXISTS vehicle_catalog (
  id          VARCHAR(36)  COLLATE utf8mb4_general_ci NOT NULL,
  name        VARCHAR(120) NOT NULL,
  icon        VARCHAR(10)  NOT NULL DEFAULT '🚗',
  price_coins INT UNSIGNED NOT NULL DEFAULT 0,
  speed       FLOAT        NOT NULL DEFAULT 5.0,
  model_url   VARCHAR(512)     NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Assets (material + escala) dos veículos — espelho de city_palette_assets
-- Nota: FKs omitidas intencionalmente para evitar incompatibilidade de collation
-- entre tabelas criadas em contextos diferentes. As relações são resolvidas
-- em nível de aplicação (TypeORM relations).
CREATE TABLE IF NOT EXISTS vehicle_assets (
  vehicle_id   VARCHAR(36) COLLATE utf8mb4_general_ci NOT NULL,
  material_id  VARCHAR(36) COLLATE utf8mb4_general_ci     NULL,
  scale_factor FLOAT       NOT NULL DEFAULT 1.0,
  PRIMARY KEY (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Adicionar catalog_id em user_vehicles
SELECT COUNT(*) INTO @col_exists
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME   = 'user_vehicles'
  AND COLUMN_NAME  = 'catalog_id';

SET @add_col = IF(@col_exists = 0,
  'ALTER TABLE user_vehicles ADD COLUMN catalog_id VARCHAR(36) NULL AFTER vehicle_type',
  'SELECT 1'
);
PREPARE stmt FROM @add_col;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. Registrar migration
INSERT IGNORE INTO migrations (filename, status) VALUES ('015-vehicle-catalog.sql', 'applied');
