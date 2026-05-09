-- ─────────────────────────────────────────────────────────────────────────────
-- 004-land-expansion.sql
-- Sistema de expansão de terreno por tiles (grid 5×5 por cidade)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS land_tiles (
  id           VARCHAR(36)      NOT NULL DEFAULT (UUID()),
  city_user_id VARCHAR(36)      NOT NULL,
  tile_x       TINYINT UNSIGNED NOT NULL,   -- 0..4 (eixo X do grid)
  tile_z       TINYINT UNSIGNED NOT NULL,   -- 0..4 (eixo Z do grid)
  purchased_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE  KEY UK_LAND_TILE        (city_user_id, tile_x, tile_z),
  INDEX        IDX_LAND_TILE_CITY (city_user_id),

  CONSTRAINT FK_LAND_TILE_CITY
    FOREIGN KEY (city_user_id)
    REFERENCES city_meta (user_id)
    ON DELETE CASCADE
);

-- ─── Seed: tiles iniciais (2×2) para todas as cidades já existentes ──────────
-- Tiles (0,0), (1,0), (0,1), (1,1) correspondem ao plot de início
INSERT IGNORE INTO land_tiles (city_user_id, tile_x, tile_z)
  SELECT user_id, 0, 0 FROM city_meta;

INSERT IGNORE INTO land_tiles (city_user_id, tile_x, tile_z)
  SELECT user_id, 1, 0 FROM city_meta;

INSERT IGNORE INTO land_tiles (city_user_id, tile_x, tile_z)
  SELECT user_id, 0, 1 FROM city_meta;

INSERT IGNORE INTO land_tiles (city_user_id, tile_x, tile_z)
  SELECT user_id, 1, 1 FROM city_meta;
