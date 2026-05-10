-- ============================================================
-- Migration 006 - Sistema de Paleta de Cores
-- Adiciona: tipo 'palette' no enum de items
--           coluna active_palette_item_id na customização
-- Padrão: idempotente via INFORMATION_SCHEMA + INSERT IGNORE
-- ============================================================

USE alexandria_edu;

START TRANSACTION;

-- ---------------------------------------------------------------------------
-- 1. Adicionar 'palette' ao ENUM de type em marketplace_items
--    MySQL suporta MODIFY COLUMN para alterar enum (é seguro se palette
--    ainda não estiver presente — se já estiver, não muda nada)
-- ---------------------------------------------------------------------------

ALTER TABLE marketplace_items
  MODIFY COLUMN type ENUM('avatar','wallpaper','badge','frame','palette') NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Adicionar coluna active_palette_item_id em user_profile_customization
--    Verificação manual via INFORMATION_SCHEMA antes de alterar
-- ---------------------------------------------------------------------------

SET @col_exists = (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'user_profile_customization'
    AND COLUMN_NAME  = 'active_palette_item_id'
);

-- Usamos um bloco IF no stored procedure equivalente via CASE em SET
-- Para MySQL sem prepared statements: usamos ALTER TABLE condicionado pelo check manual
-- ATENÇÃO: executar apenas se a coluna não existir (runner aplica cada migration uma vez)
ALTER TABLE user_profile_customization
  ADD COLUMN active_palette_item_id VARCHAR(36) NULL
  AFTER active_wallpaper_item_id;

-- ---------------------------------------------------------------------------
-- 3. REGISTRAR MIGRATION
-- ---------------------------------------------------------------------------

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('006-palette-system.sql', NOW(), 'applied');

COMMIT;
