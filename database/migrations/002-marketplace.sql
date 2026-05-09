-- =============================================================================
-- Migration 002 — Marketplace System
-- Tabelas: marketplace_seasons, marketplace_items, user_inventory,
--          user_profile_customization
-- Segue padrão idempotente: sem ADD COLUMN IF NOT EXISTS (MySQL não suporta)
-- =============================================================================

START TRANSACTION;

SET NAMES utf8mb4;
SET character_set_client = utf8mb4;
SET character_set_results = utf8mb4;
SET collation_connection = utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 1. CRIAÇÃO DE TABELAS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS marketplace_seasons (
  id         CHAR(36)     NOT NULL DEFAULT (UUID()),
  name       VARCHAR(120) NOT NULL,
  starts_at  DATETIME     NOT NULL,
  ends_at    DATETIME     NOT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX IDX_MKT_SEASON_ACTIVE (is_active, ends_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS marketplace_items (
  id          CHAR(36)                                           NOT NULL DEFAULT (UUID()),
  name        VARCHAR(120)                                       NOT NULL,
  description TEXT                                               NULL,
  type        ENUM('avatar','wallpaper','badge','frame')         NOT NULL,
  image_url   VARCHAR(500)                                       NULL,
  preview_url VARCHAR(500)                                       NULL,
  price_coins INT                                                NOT NULL DEFAULT 0,
  rarity      ENUM('common','rare','epic','legendary')           NOT NULL DEFAULT 'common',
  is_active   TINYINT(1)                                         NOT NULL DEFAULT 1,
  season_id   CHAR(36)                                           NULL,
  created_at  TIMESTAMP                                          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX IDX_MKT_ITEM_TYPE    (type),
  INDEX IDX_MKT_ITEM_RARITY  (rarity),
  INDEX IDX_MKT_ITEM_ACTIVE  (is_active),
  INDEX IDX_MKT_ITEM_SEASON  (season_id),
  CONSTRAINT FK_MKT_ITEM_SEASON FOREIGN KEY (season_id)
    REFERENCES marketplace_seasons (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_inventory (
  id           CHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id      CHAR(36)  NOT NULL,
  item_id      CHAR(36)  NOT NULL,
  purchased_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY UQ_USER_ITEM (user_id, item_id),
  INDEX IDX_INV_USER (user_id),
  CONSTRAINT FK_INV_USER FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT FK_INV_ITEM FOREIGN KEY (item_id)
    REFERENCES marketplace_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_profile_customization (
  user_id                CHAR(36) NOT NULL,
  active_avatar_item_id  CHAR(36) NULL,
  active_frame_item_id   CHAR(36) NULL,
  active_badge_item_id   CHAR(36) NULL,
  active_wallpaper_item_id CHAR(36) NULL,
  updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT FK_PROFILE_USER        FOREIGN KEY (user_id)               REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT FK_PROFILE_AVATAR      FOREIGN KEY (active_avatar_item_id) REFERENCES marketplace_items (id) ON DELETE SET NULL,
  CONSTRAINT FK_PROFILE_FRAME       FOREIGN KEY (active_frame_item_id)  REFERENCES marketplace_items (id) ON DELETE SET NULL,
  CONSTRAINT FK_PROFILE_BADGE       FOREIGN KEY (active_badge_item_id)  REFERENCES marketplace_items (id) ON DELETE SET NULL,
  CONSTRAINT FK_PROFILE_WALLPAPER   FOREIGN KEY (active_wallpaper_item_id) REFERENCES marketplace_items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. SEED — Temporada inaugural
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO marketplace_seasons (id, name, starts_at, ends_at, is_active)
VALUES (
  'season-0001-0000-0000-000000000001',
  'Temporada Fundadores',
  '2026-05-01 00:00:00',
  '2026-07-31 23:59:59',
  1
);

-- ---------------------------------------------------------------------------
-- 3. SEED — Itens do marketplace
-- ---------------------------------------------------------------------------

-- Avatares common (grátis para praticar)
INSERT IGNORE INTO marketplace_items (id, name, description, type, image_url, price_coins, rarity, is_active, season_id)
VALUES
  ('item-av01-0000-0000-000000000001', 'Avatar Explorador',    'O clássico avatar de quem está começando.', 'avatar', '/marketplace/avatar-explorer.svg',   0,   'common',    1, NULL),
  ('item-av02-0000-0000-000000000002', 'Avatar Mago Violet',   'Poder arcano representado em roxo elétrico.', 'avatar', '/marketplace/avatar-mage.svg',       120, 'rare',      1, NULL),
  ('item-av03-0000-0000-000000000003', 'Avatar Cyber Scout',   'Futurismo e tecnologia em azul neon.',       'avatar', '/marketplace/avatar-cyber.svg',      280, 'epic',      1, NULL),
  ('item-av04-0000-0000-000000000004', 'Avatar Archon Legend', 'O guardião lendário da Alexandria.',         'avatar', '/marketplace/avatar-archon.svg',     750, 'legendary', 1, 'season-0001-0000-0000-000000000001');

-- Badges common / rare
INSERT IGNORE INTO marketplace_items (id, name, description, type, image_url, price_coins, rarity, is_active, season_id)
VALUES
  ('item-bg01-0000-0000-000000000001', 'Badge Iniciante',      'Para quem deu o primeiro passo.',           'badge', '/marketplace/badge-starter.svg',      0,   'common',    1, NULL),
  ('item-bg02-0000-0000-000000000002', 'Badge Estudioso',      'Concluiu 10 aulas na plataforma.',          'badge', '/marketplace/badge-studious.svg',     80,  'rare',      1, NULL),
  ('item-bg03-0000-0000-000000000003', 'Badge Fundador',       'Presente exclusivo da temporada inaugural.','badge', '/marketplace/badge-founder.svg',      500, 'legendary', 1, 'season-0001-0000-0000-000000000001');

-- Frames
INSERT IGNORE INTO marketplace_items (id, name, description, type, image_url, price_coins, rarity, is_active, season_id)
VALUES
  ('item-fr01-0000-0000-000000000001', 'Frame Aurora',         'Moldura com gradiente aurora boreal.',      'frame', '/marketplace/frame-aurora.svg',       150, 'rare',      1, NULL),
  ('item-fr02-0000-0000-000000000002', 'Frame Gold Archon',    'Moldura dourada exclusiva de fundadores.',  'frame', '/marketplace/frame-gold-archon.svg',  600, 'legendary', 1, 'season-0001-0000-0000-000000000001');

-- Wallpapers
INSERT IGNORE INTO marketplace_items (id, name, description, type, image_url, price_coins, rarity, is_active, season_id)
VALUES
  ('item-wp01-0000-0000-000000000001', 'Wallpaper Cosmos',     'Fundo estrelado do universo digital.',      'wallpaper', '/marketplace/wp-cosmos.svg',      200, 'rare',      1, NULL),
  ('item-wp02-0000-0000-000000000002', 'Wallpaper Neon Grid',  'Grade neon estilo cyberpunk.',              'wallpaper', '/marketplace/wp-neon-grid.svg',   450, 'epic',      1, NULL);

-- ---------------------------------------------------------------------------
-- 4. REGISTRAR MIGRATION
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('002-marketplace.sql', NOW(), 'applied');

COMMIT;
