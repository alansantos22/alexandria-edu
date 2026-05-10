-- Adds albedo_color_space and flip_y configuration to city_materials.
-- These fields tell the Three.js renderer how to load textures per material,
-- allowing different asset providers (PolyPerfect, Unity, Unreal, etc.) to coexist.

USE alexandria_edu;

ALTER TABLE city_materials
  ADD COLUMN albedo_color_space VARCHAR(10) NOT NULL DEFAULT 'srgb',
  ADD COLUMN flip_y             TINYINT(1)  NOT NULL DEFAULT 0;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('011-material-texture-config.sql', NOW(), 'applied');
