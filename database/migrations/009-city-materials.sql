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

-- 2. Add material reference to building assets
ALTER TABLE city_palette_assets
  ADD COLUMN material_id VARCHAR(36) NULL AFTER palette_item_id;

ALTER TABLE city_palette_assets
  ADD CONSTRAINT fk_cpa_material
  FOREIGN KEY (material_id) REFERENCES city_materials(id) ON DELETE SET NULL;

-- 3. Drop inline texture columns (now managed in city_materials)
ALTER TABLE city_palette_assets DROP COLUMN texture_albedo;
ALTER TABLE city_palette_assets DROP COLUMN texture_normal;
ALTER TABLE city_palette_assets DROP COLUMN texture_roughness_metalness;
ALTER TABLE city_palette_assets DROP COLUMN texture_ao;
ALTER TABLE city_palette_assets DROP COLUMN texture_emissive;
ALTER TABLE city_palette_assets DROP COLUMN roughness;
ALTER TABLE city_palette_assets DROP COLUMN metalness;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('009-city-materials.sql', NOW(), 'applied');
