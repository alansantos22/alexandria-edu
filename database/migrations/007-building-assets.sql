-- Asset table for 3D city buildings: stores texture maps and PBR material config
CREATE TABLE IF NOT EXISTS city_palette_assets (
  palette_item_id             VARCHAR(36)   NOT NULL,
  texture_albedo              VARCHAR(512)  NULL,
  texture_normal              VARCHAR(512)  NULL,
  texture_roughness_metalness VARCHAR(512)  NULL,
  texture_ao                  VARCHAR(512)  NULL,
  roughness                   FLOAT         NOT NULL DEFAULT 0.7,
  metalness                   FLOAT         NOT NULL DEFAULT 0.0,
  scale_factor                FLOAT         NOT NULL DEFAULT 1.0,
  PRIMARY KEY (palette_item_id),
  CONSTRAINT fk_cpa_palette FOREIGN KEY (palette_item_id)
    REFERENCES city_palette(id) ON DELETE CASCADE
);

INSERT IGNORE INTO migrations (name) VALUES ('007-building-assets');
