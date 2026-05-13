-- Adds albedo_color_space and flip_y configuration to city_materials.
-- These fields tell the Three.js renderer how to load textures per material,
-- allowing different asset providers (PolyPerfect, Unity, Unreal, etc.) to coexist.

USE alexandria_edu;

DROP PROCEDURE IF EXISTS migration_011_add_cols;
CREATE PROCEDURE migration_011_add_cols()
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_materials' AND COLUMN_NAME = 'albedo_color_space'
  ) THEN
    ALTER TABLE city_materials ADD COLUMN albedo_color_space VARCHAR(10) NOT NULL DEFAULT 'srgb';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_materials' AND COLUMN_NAME = 'flip_y'
  ) THEN
    ALTER TABLE city_materials ADD COLUMN flip_y TINYINT(1) NOT NULL DEFAULT 0;
  END IF;
END;
CALL migration_011_add_cols();
DROP PROCEDURE IF EXISTS migration_011_add_cols;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('011-material-texture-config.sql', NOW(), 'applied');
