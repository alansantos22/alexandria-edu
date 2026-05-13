# Highway System — Roadmap (Sessões 2+)

Documento de planejamento para evolução do sistema de rodovias do WorldView,
após implementação da **v1** (backbone determinística + ramais retos).

---

## 🎯 Estado atual após Sessão 1 (v1)

- **Backbone infinita** ao longo do eixo X, anchors a cada `HIGHWAY_ANCHOR_STEP` (~220u).
- **Curva orgânica**: `z = noise(x/k) * lateralAmp` deslocando os anchors.
- **2 faixas + canteiro central** (3 ribbons: pista esq, canteiro, pista dir).
- **Cidades reposicionadas** lateralmente em relação ao anchor mais próximo.
- **Ramais 1-faixa** perpendiculares ligando cada cidade ao ponto de projeção na backbone.
- **Trecho reto perto da cidade**: anchors próximos a uma cidade são "puxados" para alinhar com ela (reduz curvatura local).
- **Sem A***, **sem pontes**, **sem túneis** — backbone segue altura suavizada do terreno.

---

## 💡 Sessão 2 — Pontes, Viadutos e Túneis (ETS2-style)

### Conceito
Para cada **segmento da backbone** entre dois anchors consecutivos (`A → B`), comparar a altura "desejada" da estrada (interpolação suavizada) com a altura real do terreno sob ela. Decidir o tipo de estrutura.

### Heurísticas

| Condição (amostragem ao longo do segmento) | Decisão |
|---|---|
| `terrain - road > +6u` por mais de 30u contínuos | **Túnel** — gera entradas (portal) + cilindro vazado |
| `road - terrain > +6u` por mais de 25u contínuos | **Viaduto/ponte** — gera tabuleiro elevado + pilares a cada 12u |
| `road - terrain > +12u` E é vão sobre rio/lago/canyon | **Ponte suspensa** (variante visual) |
| Diferença média < 2u | Asfalto direto, terreno aplainado em ROAD_FLAT |

### Algoritmo de detecção
```js
// Para cada par (anchor_i, anchor_i+1):
const N = 16
const samples = []
for (let k = 0; k <= N; k++) {
  const t = k / N
  const p = lerp(anchor_i, anchor_i+1, t)
  const roadY = lerp(anchor_i.y, anchor_i+1.y, smoothstep(t))
  const terrY = _heightBaseAt(p.x, p.z)
  samples.push({ p, roadY, terrY, delta: roadY - terrY })
}
// Detecta runs contínuos de delta > +6 → ponte; < -6 → túnel
const structures = detectRuns(samples, +6, -6)
```

### Geometria de Ponte (Mesh)
- **Tabuleiro**: extrusão da seção da estrada elevada até `roadY`.
- **Pilares**: `CylinderGeometry(0.6, 0.6, roadY - terrY, 6)` a cada ~12u.
- **Guardrails**: 2 linhas paralelas elevadas 0.8u — `BoxGeometry(width, 0.05, len)`.
- **Pontes suspensas** (variante longa >100u): adicionar 2 torres `BoxGeometry` + cabos `Line` ou `CylinderGeometry` fino.

### Geometria de Túnel (Mesh)
- **Portais**: 2 frames `BoxGeometry` nas extremidades com furo no centro.
- **Teto/parede**: meia-esfera estendida (`TorusGeometry` ou tubo extrudado da spline).
- **Iluminação interna**: 2-3 `PointLight` amarelos baratos (ou pular para perf, com vertex color brighten).

### Cuidados de perf
- Pontes/túneis são meshes adicionais; gerar **apenas em segmentos visíveis** (mesmo culling da backbone).
- Reusar geometrias quando possível (`InstancedMesh` para pilares).
- Excluir vegetação dentro da bounding box de túneis.

---

## 💡 Sessão 3 (opcional) — Highway A* com pathfinding (Opção B do plano)

### Motivação
A v1 usa `z = noise(x)` para curvar a backbone. Funciona, mas **não evita montanhas/rios**. O resultado é "razoavelmente natural" — mas não otimizado. ETS2/ATS modelam rotas que **contornam obstáculos**.

### Solução: A* hierárquico em chunks
Inspirado em **Infinite Lands (Sapra, Unity)** e **LayerProcGen (Rune Skovbo)**.

#### Layered generation
1. **Layer macro** (chunks 1024×1024u): planeja rota aproximada entre "macro-anchors" usando A* sobre heightmap downsampled.
2. **Layer detalhada** (chunks 256×256u): refina rota usando A* fino com custo por:
   - `Δh^2` (penaliza subida)
   - `+∞` se atravessa plot de cidade
   - `+grande` se atravessa rio (a menos que esteja no list de "ponte permitida")
   - `+médio` em biome=mountain (incentiva contornar)
3. **Layer rendering**: extrai polyline da rota, suaviza com Catmull-Rom, gera mesh.

#### Estrutura de código
```
frontend/src/highway/
├── HighwayLayer.js          # Coordena macro/detail
├── AStarChunk.js            # A* em um chunk (com bordas determinísticas)
├── HeightmapSampler.js      # Cache de _heightBaseAt amostrado
└── HighwayGraph.js          # Persiste anchors macro em mapa global
```

#### Determinismo entre chunks
- Cada chunk macro tem **anchors fixos nas 4 bordas** (hash da coordenada de borda × seed).
- A* dentro do chunk sempre conecta borda-leste → borda-oeste (e norte→sul).
- Vizinhos compartilham anchors de borda → continuidade garantida.

#### Performance
- A* em web worker dedicado.
- Cache de chunks já calculados (LRU 50 chunks).
- Custo estimado: 50–200ms por chunk macro, gerado assincronamente.

### Pré-requisitos
- Heightmap exposto como função pura O(1) cacheável.
- Lista global de plots/cidades acessível ao worker.
- Lista global de rios/lakes ao worker.

---

## 💡 Sessão 4 (futuro) — Network: bifurcações e rotas secundárias

- Backbone principal vira **highway primária** (4 faixas, asfalto escuro).
- Adicionar **highways secundárias** perpendiculares a cada N anchors (cruzando em "T" ou "Y").
- Conexões entre highways via **clover/diamond interchanges** simples.
- Ramais de cidade conectam à highway secundária mais próxima.
- Determinismo: bifurcações são pré-computadas pelo seed do anchor.

---

## 💡 Sessão 5 (visual polish)

- **Faixa amarela contínua** nos limites externos (em vez de só central tracejada).
- **Acostamento** (faixa cinza mais clara nas bordas).
- **Guardrails** ao longo de todos os trechos (`InstancedMesh` baratos).
- **Placas de sinalização** (km, próxima cidade) em pontos chave.
- **Texturas de asfalto** (substituir `MeshLambertMaterial color` por textura tileável).
- **Iluminação noturna** (postes a cada 30u com `PointLight` light-baked).

---

## 📚 Referências

- **Infinite Lands (Sapra)** — https://jettelly.com/blog/infinite-lands-a-look-at-its-spline-based-road-system
- **LayerProcGen (Rune Skovbo)** — https://runevision.github.io/LayerProcGen/
- **PCG Road Generation UE5** — https://dev.epicgames.com/community/learning/tutorials/9dpd/procedural-road-generation-in-unreal-engine-5-pcg
- **ETS2 dev blog (SCS Software)** — modelagem manual de splines com prefabs

---

## ⚠️ Notas críticas

- **Determinismo**: tudo precisa derivar de `TERRAIN_NOISE_SEED`. Mesma seed → mesma highway no mundo todo, sempre.
- **Streaming**: backbone deve gerar mesh **somente em janelas visíveis** (similar a chunks de terreno).
- **Coerência com cidades**: backend tem `world_x/world_z` por cidade. Frontend é livre para **renderizar em offset lateral** baseado na backbone — backend não muda.
- **Performance budget**: highway mesh total < 30k tris no view distance (rodovia simples) ou < 80k tris (com pontes/túneis).
