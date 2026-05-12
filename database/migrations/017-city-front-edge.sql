-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 017: City frontEdge orientation
-- ─────────────────────────────────────────────────────────────────────────────
-- Adiciona a coluna `front_edge` em city_meta (0=N, 1=E, 2=S, 3=W).
-- Define a direção em que a cidade está virada — usada pelo CityRenderer para
-- rotacionar o grid e alinhar a "fachada" com a estrada incidente (Fase 3).
--
-- Backfill: para cidades existentes, escolhemos a direção do primeiro vizinho
-- encontrado na ordem de prioridade N > E > S > W. Cidades isoladas ficam com 0.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE city_meta
  ADD COLUMN front_edge TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER world_z;

UPDATE city_meta cm
LEFT JOIN city_meta n_n ON n_n.world_x = cm.world_x     AND n_n.world_z = cm.world_z - 1
LEFT JOIN city_meta n_e ON n_e.world_x = cm.world_x + 1 AND n_e.world_z = cm.world_z
LEFT JOIN city_meta n_s ON n_s.world_x = cm.world_x     AND n_s.world_z = cm.world_z + 1
LEFT JOIN city_meta n_w ON n_w.world_x = cm.world_x - 1 AND n_w.world_z = cm.world_z
SET cm.front_edge = (
  CASE
    WHEN n_n.user_id IS NOT NULL THEN 0
    WHEN n_e.user_id IS NOT NULL THEN 1
    WHEN n_s.user_id IS NOT NULL THEN 2
    WHEN n_w.user_id IS NOT NULL THEN 3
    ELSE 0
  END
);

-- Registrar migration
INSERT IGNORE INTO migrations (filename, status) VALUES ('017-city-front-edge.sql', 'applied');
