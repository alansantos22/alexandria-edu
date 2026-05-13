-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 018: City biome
-- ─────────────────────────────────────────────────────────────────────────────
-- Adiciona a coluna `biome` em city_meta. Atribuída deterministicamente a partir
-- de (world_x, world_z) via biome.util (Voronoi + ruído climático).
--
-- Lista inicial: 'plains', 'forest', 'desert', 'mountain', 'tundra', 'savanna'.
-- O backfill é feito em runtime pelo CityModule (idempotente) — aqui só criamos
-- a coluna com default 'plains'.
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS migration_018_add_col;
CREATE PROCEDURE migration_018_add_col()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_meta' AND COLUMN_NAME = 'biome'
  ) THEN
    ALTER TABLE city_meta ADD COLUMN biome VARCHAR(32) NOT NULL DEFAULT 'plains' AFTER front_edge;
  END IF;
END;
CALL migration_018_add_col();
DROP PROCEDURE IF EXISTS migration_018_add_col;

-- Registrar migration
INSERT IGNORE INTO migrations (filename, status) VALUES ('018-city-biome.sql', 'applied');
