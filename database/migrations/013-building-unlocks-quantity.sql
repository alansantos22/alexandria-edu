-- Migration 013: Allow multiple building unlocks (quantity system)
-- Each purchase creates a new row in user_building_unlocks.
-- This removes the unique constraint so users can buy the same building multiple times.

ALTER TABLE user_building_unlocks DROP INDEX uq_ubu_user_item;

INSERT IGNORE INTO migrations (filename, applied_at, status)
VALUES ('013-building-unlocks-quantity.sql', NOW(), 'applied');
