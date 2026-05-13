# TODO — Highway System v1 (Infinite Backbone + City Spurs)

**Data/Hora:** 2026-05-12
**Sessão:** highway-v1
**Status Geral:** ⏳ EM PROGRESSO

## 🎯 OBJETIVO
Substituir o sistema atual de estradas (adjacency-based, cortando plots) por highway determinística ETS2-style:
- Backbone infinita ao longo do eixo X com 2 faixas + canteiro central.
- Cidades reposicionadas adjacentes à highway (offset lateral, nunca cortadas).
- Ramais 1-faixa perpendiculares cidade ↔ highway.
- Biomas mais curtos (3–5 cidades/bioma).
- Pontes/túneis + A* ficam para sessão 2 — documentado em `frontend/docs/HIGHWAY-ROADMAP.md`.

## 📋 CHECKLIST
- [x] Documentar Opção B + Pontes/Túneis — `frontend/docs/HIGHWAY-ROADMAP.md`
- [ ] Reduzir frequência dos biomas
- [ ] Implementar anchors infinitos da backbone (`_buildHighwayBackbone`)
- [ ] Refactor `cityVisualPos` — offset lateral relativo à backbone
- [ ] `_buildCitySpurs` perpendiculares retos
- [ ] Mesh 2 faixas + canteiro central na backbone
- [ ] Mesh 1 faixa nos spurs
- [ ] Remover `_buildRoadCurves` antigo
- [ ] Adaptar `_polylinesToFlat` para backbone + spurs
- [ ] `npm run build` passa

## 🎉 CONCLUSÃO
- [ ] TODOS OS CHECKS CONCLUÍDOS
- [ ] VALIDAÇÃO FINAL
