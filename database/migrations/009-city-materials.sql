-- Extracts PBR texture data into a reusable city_materials table.
-- Buildings reference a material via FK, enabling material reuse and GPU batching.

USE alexandria_edu;

-- 1. Create reusable materials table
CREATE TABLE IF NOT EXISTS city_materials (
  id                          VARCHAR(36)   NOT NULL,
  name                        VARCHAR(120)  NOT NULL,
  texture_albedo              VARCHAR(512)  NULL,
  texture_normal              VARCHAR(512)  NULL,
  texture_roughness_metalness VARCHAR(512)  NULL,
  texture_ao                  VARCHAR(512)  NULL,
  texture_emissive            VARCHAR(512)  NULL,
  roughness                   FLOAT         NOT NULL DEFAULT 0.7,
  metalness                   FLOAT         NOT NULL DEFAULT 0.0,
  created_at                  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 2. Add material reference to building assets (idempotente)
DROP PROCEDURE IF EXISTS migration_009_alter_assets;
CREATE PROCEDURE migration_009_alter_assets()
BEGIN
  -- ADD COLUMN material_id
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'material_id'
  ) THEN
    ALTER TABLE city_palette_assets ADD COLUMN material_id VARCHAR(36) NULL AFTER palette_item_id;
  END IF;

  -- ADD CONSTRAINT fk_cpa_material
  IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND CONSTRAINT_NAME = 'fk_cpa_material'
  ) THEN
    ALTER TABLE city_palette_assets
      ADD CONSTRAINT fk_cpa_material FOREIGN KEY (material_id) REFERENCES city_materials(id) ON DELETE SET NULL;
  END IF;

  -- DROP inline texture columns (apenas se ainda existirem)
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'texture_albedo') THEN
    ALTER TABLE city_palette_assets DROP COLUMN texture_albedo;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'texture_normal') THEN
    ALTER TABLE city_palette_assets DROP COLUMN texture_normal;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'texture_roughness_metalness') THEN
    ALTER TABLE city_palette_assets DROP COLUMN texture_roughness_metalness;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'texture_ao') THEN
    ALTER TABLE city_palette_assets DROP COLUMN texture_ao;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'texture_emissive') THEN
    ALTER TABLE city_palette_assets DROP COLUMN texture_emissive;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'roughness') THEN
    ALTER TABLE city_palette_assets DROP COLUMN roughness;
  END IF;
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'city_palette_assets' AND COLUMN_NAME = 'metalness') THEN
    ALTER TABLE city_palette_assets DROP COLUMN metalness;
  END IF;
END;
CALL migration_009_alter_assets();
DROP PROCEDURE IF EXISTS migration_009_alter_assets;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('009-city-materials.sql', NOW(), 'applied');
