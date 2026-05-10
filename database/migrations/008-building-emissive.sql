-- Add emissive texture map to building assets
ALTER TABLE city_palette_assets
  ADD COLUMN texture_emissive VARCHAR(512) NULL
  AFTER texture_ao;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('008-building-emissive.sql', NOW(), 'applied');
