-- ============================================================
-- Migration 005 - Novos frames CSS e ajustes de marketplace
-- Adiciona: 8 novos frame presets (lightning, led-red, led-green,
--           holographic, glitch, stardust, plasma, ice)
-- Padrão: INSERT IGNORE (idempotente)
-- ============================================================

USE alexandria_edu;

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1. NOVOS FRAME PRESETS (INSERT IGNORE = seguro para re-executar)
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO marketplace_items (id, name, description, type, image_url, price_coins, rarity, is_active, created_at)
VALUES
  ('item-fr09', 'Raios Elétricos',   'Borda com efeito de raios e faíscas animados.',          'frame', 'frame:lightning',    280, 'epic',      1, NOW()),
  ('item-fr10', 'LED Vermelho',       'Tira de LED vermelho pulsante ao redor do avatar.',       'frame', 'frame:led-red',       80, 'common',    1, NOW()),
  ('item-fr11', 'LED Verde Gaming',   'Tira de LED verde estilo gaming.',                        'frame', 'frame:led-green',     80, 'common',    1, NOW()),
  ('item-fr12', 'Holográfico',        'Borda holográfica iridescente que rotaciona de cor.',     'frame', 'frame:holographic',  350, 'legendary', 1, NOW()),
  ('item-fr13', 'Glitch Digital',     'Efeito glitch caótico de cor e deslocamento digital.',   'frame', 'frame:glitch',        220, 'rare',      1, NOW()),
  ('item-fr14', 'Poeira de Estrelas', 'Borda dourada cintilante com reflexos estelares.',        'frame', 'frame:stardust',     180, 'rare',      1, NOW()),
  ('item-fr15', 'Plasma Instável',    'Plasma roxo e ciano em rotação contínua.',                'frame', 'frame:plasma',       300, 'epic',      1, NOW()),
  ('item-fr16', 'Gelo Cristalino',    'Borda com shimmer de gelo — brilho frio e elegante.',    'frame', 'frame:ice',          150, 'rare',      1, NOW());

-- ---------------------------------------------------------------------------
-- 2. REGISTRAR MIGRATION
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('005-new-frames-and-admin.sql', NOW(), 'applied');

COMMIT;
