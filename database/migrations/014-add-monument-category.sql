-- ============================================================
-- Alexandria EDU - Migration 014: Add Monument Category
-- Engine: MySQL 8.0+ / InnoDB / utf8mb4
-- ============================================================

USE alexandria_edu;

-- ============================================================
-- Add 'monuments' category to city_palette
-- Allows builders to construct monumental/landmark buildings
-- ============================================================

-- Pre-validation: Verify table exists
SELECT COUNT(*) as exists_table 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'city_palette' AND TABLE_SCHEMA = DATABASE();

-- Modify ENUM to include 'monuments'
ALTER TABLE city_palette 
MODIFY COLUMN category ENUM('residential','commercial','nature','road','decoration','monuments') 
NOT NULL DEFAULT 'residential';

-- Register migration
INSERT IGNORE INTO migrations (filename, applied_at, status) 
VALUES ('014-add-monument-category.sql', NOW(), 'success');
