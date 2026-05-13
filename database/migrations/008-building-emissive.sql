-- Add emissive texture map to building assets (idempotente)
DROP PROCEDURE IF EXISTS migration_008_add_col;
CREATE PROCEDURE migration_008_add_col()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME  = 'city_palette_assets'
      AND COLUMN_NAME = 'texture_emissive'
  ) THEN
    ALTER TABLE city_palette_assets
      ADD COLUMN texture_emissive VARCHAR(512) NULL AFTER texture_ao;
  END IF;
END;
CALL migration_008_add_col();
DROP PROCEDURE IF EXISTS migration_008_add_col;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('008-building-emissive.sql', NOW(), 'applied');
