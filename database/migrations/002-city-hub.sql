-- ============================================================
-- Alexandria EDU - Migration 002: City Hub World
-- Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- ============================================================

USE alexandria_edu;

-- ============================================================
-- CITY META — one row per user, stores world position & seed
-- ============================================================
CREATE TABLE IF NOT EXISTS city_meta (
  user_id          VARCHAR(36)      NOT NULL,
  city_seed        VARCHAR(36)      NOT NULL,
  world_x          INT              NOT NULL DEFAULT 0,
  world_z          INT              NOT NULL DEFAULT 0,
  city_level       TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_buildings  INT UNSIGNED     NOT NULL DEFAULT 0,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY UK_CITY_WORLD_POS (world_x, world_z),
  INDEX IDX_CITY_LEVEL (city_level),
  CONSTRAINT FK_CITY_META_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CITY CHUNKS — 16×16 hex-encoded building grid per chunk
-- data_hex stores up to 256 hex chars (one char = one cell).
-- RLE compression may reduce this further for sparse cities.
-- ============================================================
CREATE TABLE IF NOT EXISTS city_chunks (
  id         VARCHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id    VARCHAR(36)  NOT NULL,
  chunk_x    SMALLINT     NOT NULL,
  chunk_z    SMALLINT     NOT NULL,
  data_hex   VARCHAR(512) NOT NULL DEFAULT '',
  version    INT UNSIGNED NOT NULL DEFAULT 1,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_CHUNK_POS (user_id, chunk_x, chunk_z),
  INDEX IDX_CHUNK_USER (user_id),
  CONSTRAINT FK_CHUNK_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- USER VEHICLES — inventory of purchased vehicles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_vehicles (
  id           VARCHAR(36) NOT NULL DEFAULT (UUID()),
  user_id      VARCHAR(36) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL,
  is_active    TINYINT(1)  NOT NULL DEFAULT 0,
  purchased_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY UK_VEHICLE_TYPE (user_id, vehicle_type),
  INDEX IDX_VEHICLE_USER (user_id),
  CONSTRAINT FK_VEHICLE_USER FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
