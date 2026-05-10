-- =============================================================================
-- Migration 012: user_building_unlocks
-- Tracks which buildings each user has purchased / unlocked.
-- Buildings with price_coins = 0 are free and don't need a record.
-- =============================================================================

-- Pre-validation: check if table already exists
SELECT COUNT(*) AS already_exists
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'user_building_unlocks';

-- Schema change
CREATE TABLE IF NOT EXISTS user_building_unlocks (
  id              VARCHAR(36)  NOT NULL,
  user_id         VARCHAR(36)  NOT NULL,
  palette_item_id VARCHAR(36)  NOT NULL,
  unlocked_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ubu_user_item  (user_id, palette_item_id),
  INDEX          idx_ubu_user  (user_id),
  CONSTRAINT fk_ubu_palette_item
    FOREIGN KEY (palette_item_id) REFERENCES city_palette(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Register migration
INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('012-building-unlocks.sql', NOW(), 'applied');
