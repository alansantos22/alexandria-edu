-- =============================================================================
-- Migration 004 — Profile Bio + Customization Items
-- Adiciona campo bio em user_profile_customization
-- Seed: wallpapers CSS-based e frames CSS-based para o marketplace
-- Padrão: MySQL-safe (SET @sql = IF / PREPARE / EXECUTE para condicional)
-- =============================================================================

USE alexandria_edu;

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1. Adicionar coluna bio em user_profile_customization (se não existir)
-- ---------------------------------------------------------------------------

SET @bio_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'user_profile_customization'
    AND COLUMN_NAME  = 'bio'
);

SET @sql_bio = IF(
  @bio_exists = 0,
  'ALTER TABLE user_profile_customization ADD COLUMN bio TEXT NULL',
  'SELECT ''bio already exists, skipping'' AS info'
);

PREPARE stmt_bio FROM @sql_bio;
EXECUTE stmt_bio;
DEALLOCATE PREPARE stmt_bio;

-- ---------------------------------------------------------------------------
-- 2. Seed — Wallpapers CSS-based
-- image_url = 'css:<valor CSS>' → frontend aplica como background
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO marketplace_items
  (id, name, description, type, image_url, price_coins, rarity, is_active, season_id)
VALUES
  ('item-wp03-0000-0000-000000000003',
   'Wallpaper Violeta Profundo',
   'Gradiente roxo intenso, perfeito para quem domina a IA.',
   'wallpaper',
   'css:linear-gradient(135deg, #1a0533 0%, #2d1469 50%, #1a0533 100%)',
   100, 'common', 1, NULL),

  ('item-wp04-0000-0000-000000000004',
   'Wallpaper Aurora Boreal',
   'As cores da aurora iluminando seu perfil.',
   'wallpaper',
   'css:linear-gradient(135deg, #6C5CE7 0%, #00D9C0 50%, #FF6B9D 100%)',
   250, 'rare', 1, NULL),

  ('item-wp05-0000-0000-000000000005',
   'Wallpaper Oceano Noturno',
   'Profundezas do oceano em azul índigo.',
   'wallpaper',
   'css:linear-gradient(135deg, #0a1628 0%, #1a3a5c 50%, #0d2137 100%)',
   100, 'common', 1, NULL),

  ('item-wp06-0000-0000-000000000006',
   'Wallpaper Inferno',
   'Chamas que consomem tudo. Para os mais audaciosos.',
   'wallpaper',
   'css:linear-gradient(135deg, #1a0000 0%, #5c0a0a 40%, #cc2200 70%, #ff4d00 100%)',
   300, 'rare', 1, NULL),

  ('item-wp07-0000-0000-000000000007',
   'Wallpaper Esmeralda',
   'A floresta digital em tons de verde neon.',
   'wallpaper',
   'css:linear-gradient(135deg, #011a0f 0%, #033d1e 50%, #0a6e39 100%)',
   200, 'rare', 1, NULL),

  ('item-wp08-0000-0000-000000000008',
   'Wallpaper Dourado Lendário',
   'Exclusivo para quem chegou ao topo da Alexandria.',
   'wallpaper',
   'css:linear-gradient(135deg, #1a1000 0%, #4a3000 30%, #8b6914 60%, #ffd166 100%)',
   600, 'epic', 1, NULL),

  ('item-wp09-0000-0000-000000000009',
   'Wallpaper Cyber Pink',
   'Rosa neon cyberpunk para quem quer se destacar.',
   'wallpaper',
   'css:linear-gradient(135deg, #1a0015 0%, #4d0033 40%, #cc0066 70%, #ff6b9d 100%)',
   400, 'epic', 1, 'season-0001-0000-0000-000000000001'),

  ('item-wp10-0000-0000-000000000010',
   'Wallpaper Void Lendário',
   'O vazio absoluto que só os Archons conhecem.',
   'wallpaper',
   'css:radial-gradient(ellipse at center, #1a0040 0%, #0a001a 40%, #000000 100%)',
   800, 'legendary', 1, 'season-0001-0000-0000-000000000001');

-- ---------------------------------------------------------------------------
-- 3. Seed — Frames CSS-based
-- image_url = 'frame:<preset-key>' → frontend aplica estilos CSS mapeados
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO marketplace_items
  (id, name, description, type, image_url, price_coins, rarity, is_active, season_id)
VALUES
  ('item-fr03-0000-0000-000000000003',
   'Frame Glow Dourado',
   'Moldura com brilho dourado radiante.',
   'frame', 'frame:glow-gold',
   180, 'rare', 1, NULL),

  ('item-fr04-0000-0000-000000000004',
   'Frame Neon Azul',
   'Borda neon azul elétrico que pulsa na tela.',
   'frame', 'frame:neon-blue',
   180, 'rare', 1, NULL),

  ('item-fr05-0000-0000-000000000005',
   'Frame Fogo',
   'Chamas vermelhas envolvendo seu avatar.',
   'frame', 'frame:fire',
   220, 'rare', 1, NULL),

  ('item-fr06-0000-0000-000000000006',
   'Frame Arco-Íris Lendário',
   'Uma moldura que irradia todas as cores do espectro visível.',
   'frame', 'frame:rainbow',
   700, 'legendary', 1, 'season-0001-0000-0000-000000000001'),

  ('item-fr07-0000-0000-000000000007',
   'Frame Aurora',
   'Gradiente da aurora boreal pulsando ao redor do avatar.',
   'frame', 'frame:aurora',
   350, 'epic', 1, NULL),

  ('item-fr08-0000-0000-000000000008',
   'Frame Cyber Verde',
   'Matrix-style para quem domina o código.',
   'frame', 'frame:cyber-green',
   280, 'epic', 1, NULL);

-- ---------------------------------------------------------------------------
-- 4. REGISTRAR MIGRATION
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('004-profile-bio.sql', NOW(), 'applied');

COMMIT;
