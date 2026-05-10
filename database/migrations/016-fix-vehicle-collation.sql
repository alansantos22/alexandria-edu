-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 016: Fix vehicle tables collation
-- ─────────────────────────────────────────────────────────────────────────────
-- As tabelas vehicle_catalog e vehicle_assets foram criadas com
-- COLLATE=utf8mb4_general_ci, enquanto city_materials usa utf8mb4_unicode_ci.
-- O JOIN entre elas causa "Illegal mix of collations" no TypeORM.
-- Esta migration converte ambas para utf8mb4_unicode_ci para alinhar.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE vehicle_catalog
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE vehicle_assets
  CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Registrar migration
INSERT IGNORE INTO migrations (filename, status) VALUES ('016-fix-vehicle-collation.sql', 'applied');
