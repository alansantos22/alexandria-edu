# TODO — Fase 3: Mundo Procedural Orgânico (PR 3 → PR 7)

**Status Geral:** ⏳ EM PROGRESSO
**Sessão:** procgen-world-fase3
**Plano:** `c:\Users\win\.claude\plans\velvety-wondering-puzzle.md`

## Contexto
PR 1 (frontEdge) e PR 2 (terreno tesselado FBM + aplainamento) já mergeados (migration 017, useWorldRenderer atualizado, useCityRenderer com cityRoot rotacionado). Falta PR 3-7.

## PR 3 — Estradas spline + deformação heightmap
- [ ] Backend `findAdjacencies()` em `city.repository.ts`
- [ ] Backend endpoint `GET /city/world-map/adjacencies` (controller + service)
- [ ] Frontend `cityService.getWorldAdjacencies()`
- [ ] `WorldView.vue` busca adjacencies e passa pro `loadWorld`
- [ ] `useWorldRenderer.js`: `_generateRoadsFromAdjacencies()` com CatmullRomCurve3
- [ ] `heightAt` deforma ao longo das curves (substitui aplainamento por-eixo)
- [ ] `_nearRoad` e ambient cars usam curves
- [ ] Verificar build frontend e backend

## PR 4 — Biomas via Voronoi
- [ ] Migration `018-city-biome.sql`
- [ ] `biome.util.ts` (backend, determinístico)
- [ ] `createMeta()` preenche biome + backfill
- [ ] world-map retorna biome
- [ ] `biome.util.js` (mirror frontend)
- [ ] `_generateTerrain()` aplica vertex colors por bioma + amplitude
- [ ] Vegetação modulada por bioma

## PR 5 — Rios
- [ ] `_generateRivers()` com flow-from-peaks
- [ ] Deformação do heightmap pelos rios
- [ ] Render ribbon água

## PR 6 — Canions
- [ ] `ridgeNoiseAt()` multifractal restrito a desert/mountain

## PR 7 — Web Worker (opcional)
- [ ] `terrain.worker.js`
- [ ] Refactor renderer pra consumir chunks

## Conclusão
- [ ] PRs 3-6 funcionais
- [ ] PR 7 avaliado (skip se complexidade exceder)
