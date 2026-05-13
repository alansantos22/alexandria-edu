import { ref } from 'vue'
import {
  WebGLRenderer, Scene, OrthographicCamera, PerspectiveCamera, Color, FogExp2,
  AmbientLight, DirectionalLight, HemisphereLight,
  BoxGeometry, PlaneGeometry, ConeGeometry, CylinderGeometry, SphereGeometry, BufferGeometry,
  MeshLambertMaterial, MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial,
  InstancedMesh, Mesh, Group,
  Matrix4, Vector3,
  Points, PointsMaterial, Float32BufferAttribute,
  BackSide, SRGBColorSpace, ACESFilmicToneMapping, TextureLoader,
  CatmullRomCurve3,
} from 'three'
import { GLTFLoader }    from 'three/addons/loaders/GLTFLoader.js'
import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'
import { biomeAt, BIOME_AMPLITUDE, BIOME_COLOR } from './biome.util.js'

// ── Constants ──────────────────────────────────────────────────────────────────
const WORLD_SCALE     = 80
const PLOT_RADIUS     = 13
const ROAD_WIDTH      = 7
const SIDEWALK_W      = 2.5
const CURB_W          = 0.35
const HALF_ROAD_TOTAL = ROAD_WIDTH / 2 + CURB_W + SIDEWALK_W
const TERRAIN_HALF    = 1600     // mundo MUITO maior (era 420). Estradas/rios/árvores cobrem essa área.
const MAX_TREES       = 10000    // distribuídos em chunks — só chunks visíveis são renderizados
const VEG_CHUNK_SIZE  = 160      // grade de chunks de vegetação (2× terrain chunk)
const VEG_DRAW_DIST   = 500      // distância da câmera além da qual o chunk de veg fica invisível

// Chunked terrain streaming (PR 7): mundo dividido em chunks de WORLD_SCALE×WORLD_SCALE,
// só os próximos da câmera renderizam. Dá sensação de mundo infinito sem custo de memória.
const CHUNK_SIZE         = WORLD_SCALE                 // 80u, integer-aligned com plots
const CHUNK_SEGS_HIGH    = 40                          // tesselação dentro do raio próximo
const CHUNK_SEGS_LOW     = 12                          // tesselação dos chunks distantes
const CHUNK_RADIUS_HIGH  = 3                           // 7×7 = 49 chunks high-LOD (~560u)
const CHUNK_RADIUS_LOW   = 6                           // até 13×13 = 169 (com low-LOD nos extras)
const CHUNK_WORKER_COUNT = 2
const TERRAIN_AMPLITUDE = 7         // altura máxima das colinas em unidades de mundo
const TERRAIN_FREQ     = 0.012      // frequência base do FBM
const MOUNTAIN_PEAK_HEIGHT = 38     // chapadas: subida + topo plano
const MOUNTAIN_PEAK_THRESHOLD = 0.52 // mais raro mas mais marcante
const MOUNTAIN_CANYON_FREQ = 0.022   // canions intermontes (freq diferente de peaks)
const MOUNTAIN_CANYON_THRESHOLD = 0.55
const MOUNTAIN_CANYON_DEPTH = 14
const MOUNTAIN_WARP_AMP = 35        // domain warping (Quílez) para curvar cordilheiras
const MESA_STEP = 5                 // altura de cada faixa de chapada
const MESA_MIX  = 0.45              // intensidade do terracing
// Seed compartilhada: usada tanto na main thread quanto no terrain.worker.js
// para garantir que ambos gerem EXATAMENTE o mesmo terreno (caso contrário
// árvores/carros aparecem fora do chão visual).
const TERRAIN_NOISE_SEED = 0x5eed1234
const ROAD_FLAT_INNER  = HALF_ROAD_TOTAL + 1.5
const ROAD_FLAT_OUTER  = HALF_ROAD_TOTAL + 6
const CITY_FLAT_INNER  = PLOT_RADIUS + 2
const CITY_FLAT_OUTER  = PLOT_RADIUS + 8
const RIVER_WIDTH_MIN    = 2.0     // largura inicial (nascente)
const RIVER_WIDTH_MAX    = 6.5     // largura máxima (foz)
const RIVER_CARVE_INNER  = RIVER_WIDTH_MAX * 0.4
const RIVER_CARVE_OUTER  = RIVER_WIDTH_MAX * 2.4
const RIVER_CARVE_DEPTH  = 4.0
const LAKE_RADIUS_MIN    = 7
const LAKE_RADIUS_MAX    = 14
const ENTER_DIST      = 6
const DASH_LEN        = 4
const GAP_LEN         = 6

const DAY_SPEED = 1 / 180 // full cycle in 3 real minutes

// t: 0=midnight, 0.25=sunrise, 0.5=noon, 0.75=sunset
const PHASES = [
  { t: 0.00, top: new Color(0x04081a), bot: new Color(0x060c20), sun: new Color(0xb0baee), fog: new Color(0x020510), aI: 0.09, hI: 0.04, sI: 0.05, fd: 0.006,  st: 0.90 },
  { t: 0.20, top: new Color(0x0d0c22), bot: new Color(0x3d1a2a), sun: new Color(0xff6622), fog: new Color(0x1a0b10), aI: 0.22, hI: 0.12, sI: 0.28, fd: 0.005,  st: 0.45 },
  { t: 0.25, top: new Color(0x18103e), bot: new Color(0xff7744), sun: new Color(0xffaa44), fog: new Color(0x441820), aI: 0.42, hI: 0.22, sI: 0.62, fd: 0.0045, st: 0.00 },
  { t: 0.35, top: new Color(0x2a5cbf), bot: new Color(0x88c8e8), sun: new Color(0xfff4d6), fog: new Color(0x70b8d4), aI: 0.65, hI: 0.32, sI: 0.88, fd: 0.0035, st: 0.00 },
  { t: 0.50, top: new Color(0x3868d4), bot: new Color(0x87ceeb), sun: new Color(0xfff8e8), fog: new Color(0x87ceeb), aI: 0.78, hI: 0.38, sI: 1.00, fd: 0.0028, st: 0.00 },
  { t: 0.65, top: new Color(0x2a5cbf), bot: new Color(0x88c8e8), sun: new Color(0xfff4d6), fog: new Color(0x70b8d4), aI: 0.65, hI: 0.32, sI: 0.88, fd: 0.0035, st: 0.00 },
  { t: 0.75, top: new Color(0x180f38), bot: new Color(0xff6622), sun: new Color(0xff9933), fog: new Color(0x441820), aI: 0.42, hI: 0.22, sI: 0.62, fd: 0.0045, st: 0.00 },
  { t: 0.80, top: new Color(0x0e0b22), bot: new Color(0x3d1520), sun: new Color(0xff4411), fog: new Color(0x180a10), aI: 0.22, hI: 0.12, sI: 0.28, fd: 0.005,  st: 0.45 },
  { t: 1.00, top: new Color(0x04081a), bot: new Color(0x060c20), sun: new Color(0xb0baee), fog: new Color(0x020510), aI: 0.09, hI: 0.04, sI: 0.05, fd: 0.006,  st: 0.90 },
]

// RNG seedado (Mulberry32) com método .random() — compatível com a API
// que o SimplexNoise espera (qualquer objeto com .random() ∈ [0,1)).
function makeSeededRandomSource(seed) {
  let s = (seed >>> 0) || 1
  return {
    random() {
      s |= 0; s = (s + 0x6D2B79F5) | 0
      let t = Math.imul(s ^ (s >>> 15), 1 | s)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}
const noise = new SimplexNoise(makeSeededRandomSource(TERRAIN_NOISE_SEED))

// ── Procedural terrain ─────────────────────────────────────────────────────────
// FBM com 4 oitavas — perfil de colinas suaves. Determinístico (seed compartilhada com worker)
function _fbm(x, z) {
  let h = 0, amp = 1, freq = TERRAIN_FREQ, max = 0
  for (let i = 0; i < 4; i++) {
    h   += amp * noise.noise(x * freq, z * freq)
    max += amp
    amp *= 0.5
    freq *= 2
  }
  return h / max
}

// Ridge multifractal: |simplex| invertido → cordilheiras/fissuras finas e ramificadas.
// Aplicado como máscara de cânion em biomas desert/mountain.
const CANYON_FREQ = 0.035
const CANYON_THRESHOLD = 0.62       // mais frequente (era 0.78) mas ainda estreito
const CANYON_DEPTH = 11             // base; escalado por altitude no heightAt
const CANYON_CLIFF_WINDOW = 0.07    // largura da janela smoothstep (parede vertical)

// Ridged multifractal compound (Red Blob "Ridged noise"): octaves seguintes amplificadas
// pelas anteriores → cordilheiras hierárquicas (espinhas com sub-cristas).
function _ridgeAt(x, z) {
  const r0 = 1 - Math.abs(noise.noise(x * CANYON_FREQ + 100, z * CANYON_FREQ - 100))
  const e0 = r0 * r0
  const r1 = 1 - Math.abs(noise.noise(x * CANYON_FREQ * 2 + 100, z * CANYON_FREQ * 2 - 100))
  const e1 = r1 * r1 * e0
  const r2 = 1 - Math.abs(noise.noise(x * CANYON_FREQ * 4 + 100, z * CANYON_FREQ * 4 - 100))
  const e2 = r2 * r2 * (e0 + e1)
  return (e0 + 0.5 * e1 + 0.25 * e2) / 1.75
}

// Ridge alternativo (offsets diferentes) — usado para canions intermontes em biome=mountain.
function _ridgeAtAlt(x, z, freq0) {
  let h = 0, amp = 1, freq = freq0, max = 0
  for (let i = 0; i < 3; i++) {
    const n = 1 - Math.abs(noise.noise(x * freq - 50, z * freq + 50))
    h   += amp * n * n
    max += amp
    amp *= 0.5
    freq *= 2
  }
  return h / max
}

// FBM com domain warping (Quílez): curva as cordilheiras em formas orgânicas em vez de
// listras paralelas. Usa duas amostras de ruído como deslocamento das coords antes do FBM.
function _fbmWarped(x, z) {
  const q1 = noise.noise(x * TERRAIN_FREQ * 0.5 + 13.1, z * TERRAIN_FREQ * 0.5 - 7.7)
  const q2 = noise.noise(x * TERRAIN_FREQ * 0.5 + 5.2,  z * TERRAIN_FREQ * 0.5 + 1.3)
  return _fbm(x + q1 * MOUNTAIN_WARP_AMP, z + q2 * MOUNTAIN_WARP_AMP)
}

// Quantiza altura em faixas com transição smoothstep — produz "chapadas" (mesas) escalonadas.
function _mesaTerrace(h, step, mix) {
  if (h <= 0) return h
  const band = Math.floor(h / step)
  const frac = h / step - band
  let ss = 0
  if (frac >= 0.7) {
    const u = (frac - 0.7) / 0.3
    ss = u * u * (3 - 2 * u)
  }
  const terraced = (band + ss) * step
  return h * (1 - mix) + terraced * mix
}

function _flattenFactor(d, inner, outer) {
  if (d <= inner) return 0
  if (d >= outer) return 1
  const t = (d - inner) / (outer - inner)
  return 0.5 - 0.5 * Math.cos(t * Math.PI)
}

// `cityCenters` é precomputado em loadWorld pra evitar alocação no hot path
let _cityCenters = []
// Polylines das estradas (resultantes das CatmullRomCurve3 amostradas) — usadas tanto pelo
// aplainamento do heightmap quanto pelo `_nearRoad` (pra evitar árvores na pista).
// Cada item: { points: Vector3[], length: number }
let _roadPolylines = []
const ROAD_SAMPLES = 48 // pontos amostrados por curve — bom equilíbrio precisão/perf

// Polylines dos rios (gerados via gradient descent a partir de picos em biomas montanhosos).
// Cada item: { points: Vector3[], widths: Float32Array } — widths é half-width por vértice.
let _riverPolylines = []
// Lagos terminais (onde rios desembocam). Cada item: { x, z, radius }
let _lakeCenters = []

function _distPointToSegmentSq(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az
  const lenSq = dx * dx + dz * dz
  if (lenSq < 1e-6) {
    const ex = px - ax, ez = pz - az
    return ex * ex + ez * ez
  }
  let t = ((px - ax) * dx + (pz - az) * dz) / lenSq
  if (t < 0) t = 0
  else if (t > 1) t = 1
  const cx = ax + t * dx, cz = az + t * dz
  const ex = px - cx, ez = pz - cz
  return ex * ex + ez * ez
}

/** Altura do terreno BRUTA — sem flatten de estrada/cidade/rio/lago.
 *  Usada pra calcular o perfil de elevação das estradas e como alvo do lerp. */
function _heightBaseAt(x, z) {
  const biome = biomeAt(x, z, WORLD_SCALE)
  const amp = TERRAIN_AMPLITUDE * (BIOME_AMPLITUDE[biome] ?? 1)
  let h = _fbm(x, z) * amp
  if (biome === 'desert') {
    const r = _ridgeAt(x, z)
    if (r > CANYON_THRESHOLD) {
      const u = Math.min(1, (r - CANYON_THRESHOLD) / CANYON_CLIFF_WINDOW)
      const t = u * u * (3 - 2 * u)
      const altScale = Math.max(0.4, Math.min(1.6, (h + amp * 0.3) / 12))
      h -= CANYON_DEPTH * altScale * t
    }
  } else if (biome === 'mountain') {
    h = _fbmWarped(x, z) * amp
    const rc = _ridgeAtAlt(x, z, MOUNTAIN_CANYON_FREQ)
    if (rc > MOUNTAIN_CANYON_THRESHOLD) {
      const tc = (rc - MOUNTAIN_CANYON_THRESHOLD) / (1 - MOUNTAIN_CANYON_THRESHOLD)
      h -= MOUNTAIN_CANYON_DEPTH * tc * tc
    }
    const r = _ridgeAt(x, z)
    if (r > MOUNTAIN_PEAK_THRESHOLD) {
      const t = (r - MOUNTAIN_PEAK_THRESHOLD) / (1 - MOUNTAIN_PEAK_THRESHOLD)
      const shape = t < 0.65 ? t / 0.65 : 1.0
      h += MOUNTAIN_PEAK_HEIGHT * shape
    }
    if (h > 6 && h < 30) h = _mesaTerrace(h, MESA_STEP, MESA_MIX)
  }
  return h
}

/** Distância e altura interpolada no ponto mais próximo de qualquer estrada.
 *  Retorna { dist: número, height: número } */
function _roadInfoAt(x, z) {
  let bestDist = Infinity, bestH = 0
  for (const pl of _roadPolylines) {
    for (let i = 1; i < pl.points.length; i++) {
      const a = pl.points[i - 1], b = pl.points[i]
      const dx = b.x - a.x, dz = b.z - a.z
      const lenSq = dx * dx + dz * dz
      if (lenSq < 0.0001) continue
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / lenSq))
      const cx = a.x + t * dx, cz = a.z + t * dz
      const d = Math.hypot(x - cx, z - cz)
      if (d < bestDist) {
        bestDist = d
        // Interpola height entre os dois endpoints do segmento
        const ha = pl.heights ? pl.heights[i - 1] : 0
        const hb = pl.heights ? pl.heights[i]     : 0
        bestH = ha + t * (hb - ha)
      }
    }
  }
  return { dist: bestDist, height: bestH }
}

/** Menor distância (no plano XZ) do ponto (x, z) a QUALQUER polyline de estrada. */
function _distToRoads(x, z) {
  let best = Infinity
  for (const { points } of _roadPolylines) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i]
      const d2 = _distPointToSegmentSq(x, z, a.x, a.z, b.x, b.z)
      if (d2 < best) best = d2
    }
  }
  return Math.sqrt(best)
}

/** Menor distância XZ a qualquer polyline de rio. */
function _distToRivers(x, z) {
  let best = Infinity
  for (const { points } of _riverPolylines) {
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i]
      const d2 = _distPointToSegmentSq(x, z, a.x, a.z, b.x, b.z)
      if (d2 < best) best = d2
    }
  }
  return Math.sqrt(best)
}

/** Altura do terreno bruto INCLUINDO carving de rios/lagos, mas SEM aplainamento de estradas/cidades.
 *  Usado pra detecção de pontes/túneis (sessão highway-v2). */
function _terrainRawCarvedAt(x, z) {
  let h = _heightBaseAt(x, z)
  if (_riverPolylines.length) {
    const d = _distToRivers(x, z)
    if (d < RIVER_CARVE_OUTER) {
      const t = d < RIVER_CARVE_INNER
        ? 0
        : (d - RIVER_CARVE_INNER) / (RIVER_CARVE_OUTER - RIVER_CARVE_INNER)
      const k = 0.5 + 0.5 * Math.cos(t * Math.PI)
      h -= RIVER_CARVE_DEPTH * k * k
    }
  }
  for (const lake of _lakeCenters) {
    const dx = x - lake.x, dz = z - lake.z
    const d = Math.hypot(dx, dz)
    if (d < lake.radius * 1.4) {
      const inner = lake.radius * 0.7
      const outer = lake.radius * 1.4
      let k
      if (d <= inner) k = 1
      else {
        const t = (d - inner) / (outer - inner)
        k = 0.5 + 0.5 * Math.cos(t * Math.PI)
      }
      h -= RIVER_CARVE_DEPTH * 1.2 * k
    }
  }
  return h
}

export function heightAt(x, z) {
  const biome = biomeAt(x, z, WORLD_SCALE)
  const amp = TERRAIN_AMPLITUDE * (BIOME_AMPLITUDE[biome] ?? 1)
  let h = _fbm(x, z) * amp
  if (h === 0) return 0

  // Cânions só em desert: cliff abrupto + profundidade escalada por altitude
  if (biome === 'desert') {
    const r = _ridgeAt(x, z)
    if (r > CANYON_THRESHOLD) {
      // smoothstep com janela estreita → transição quase vertical (cliff)
      const u = Math.min(1, (r - CANYON_THRESHOLD) / CANYON_CLIFF_WINDOW)
      const t = u * u * (3 - 2 * u)
      // Profundidade escala com altitude: terreno alto = canyon mais fundo
      const altScale = Math.max(0.4, Math.min(1.6, (h + amp * 0.3) / 12))
      h -= CANYON_DEPTH * altScale * t
    }
  }

  // Montanhas: domain warping + canions intermontes + chapadas com topo plano + terracing.
  if (biome === 'mountain') {
    // Base recomputada com warping pra cordilheiras orgânicas (não listras paralelas).
    h = _fbmWarped(x, z) * amp

    // Canion intermonte (corte profundo entre cristas)
    const rc = _ridgeAtAlt(x, z, MOUNTAIN_CANYON_FREQ)
    if (rc > MOUNTAIN_CANYON_THRESHOLD) {
      const tc = (rc - MOUNTAIN_CANYON_THRESHOLD) / (1 - MOUNTAIN_CANYON_THRESHOLD)
      h -= MOUNTAIN_CANYON_DEPTH * tc * tc
    }

    // Picos / chapadas: sobe e platôs no topo (não cone agudo).
    const r = _ridgeAt(x, z)
    if (r > MOUNTAIN_PEAK_THRESHOLD) {
      const t = (r - MOUNTAIN_PEAK_THRESHOLD) / (1 - MOUNTAIN_PEAK_THRESHOLD)
      const shape = t < 0.65 ? t / 0.65 : 1.0
      h += MOUNTAIN_PEAK_HEIGHT * shape
    }

    // Terracing de chapadas em faixas médias (não no nível do solo nem nos picos extremos)
    if (h > 6 && h < 30) {
      h = _mesaTerrace(h, MESA_STEP, MESA_MIX)
    }
  }

  // Aplaina ao longo das splines de estrada: lerpa o terreno EM DIREÇÃO à altura da
  // centerline (não força para 0 — carros sobem ladeiras suavemente, sem trenches).
  // Highway tem footprint maior (HIGHWAY_FLAT_*) que road antiga (ROAD_FLAT_*).
  if (_roadPolylines.length) {
    const { dist: dRoad, height: roadH } = _roadInfoAt(x, z)
    if (dRoad < HIGHWAY_FLAT_OUTER) {
      const fac = _flattenFactor(dRoad, HIGHWAY_FLAT_INNER, HIGHWAY_FLAT_OUTER)
      h = h * fac + roadH * (1 - fac)
    }
  }

  // Aplaina footprint das cidades (Chebyshev distance — caixa, casa com o plot quadrado)
  for (const c of _cityCenters) {
    const d = Math.max(Math.abs(x - c.x), Math.abs(z - c.z))
    h *= _flattenFactor(d, CITY_FLAT_INNER, CITY_FLAT_OUTER)
    if (h === 0) return 0
  }

  // Carving de rios (após cidades/estradas pra que o leito persista mesmo em terreno aplainado).
  // U-shape: usa cos² pra que o leito tenha fundo plano-arredondado e bordas mais íngremes.
  if (_riverPolylines.length) {
    const d = _distToRivers(x, z)
    if (d < RIVER_CARVE_OUTER) {
      const t = d < RIVER_CARVE_INNER
        ? 0
        : (d - RIVER_CARVE_INNER) / (RIVER_CARVE_OUTER - RIVER_CARVE_INNER)
      const k = 0.5 + 0.5 * Math.cos(t * Math.PI)
      h -= RIVER_CARVE_DEPTH * k * k  // cos² = U-shape
    }
  }

  // Lagos terminais: aplaina disco e cava bacia
  if (_lakeCenters.length) {
    for (const lake of _lakeCenters) {
      const dx = x - lake.x, dz = z - lake.z
      const d = Math.hypot(dx, dz)
      if (d < lake.radius * 1.4) {
        const inner = lake.radius * 0.7
        const outer = lake.radius * 1.4
        let k
        if (d <= inner) k = 1
        else {
          const t = (d - inner) / (outer - inner)
          k = 0.5 + 0.5 * Math.cos(t * Math.PI)
        }
        h -= RIVER_CARVE_DEPTH * 1.2 * k
      }
    }
  }

  return h
}

function seededRng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1)
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61)
    return ((s ^ (s >>> 14)) >>> 0) / 0xffffffff
  }
}

function groundY() { return 0 }

// ── Highway Backbone (infinite, deterministic) ─────────────────────────────────
// Eixo X é a direção de "tráfego principal". Anchors a cada HIGHWAY_ANCHOR_STEP
// units, com deslocamento lateral em Z dado por noise(x/k) → curva orgânica
// suave estilo ETS2. Determinístico — derivado de TERRAIN_NOISE_SEED via SimplexNoise.
const HIGHWAY_ANCHOR_STEP   = 220       // espaçamento entre anchors no eixo X
const HIGHWAY_LATERAL_AMP   = 140       // amplitude lateral máxima da curva (Z)
const HIGHWAY_LATERAL_FREQ  = 0.0018    // baixa freq → curvas longas e suaves
const HIGHWAY_LANE_W        = 6.0       // largura de uma faixa (asfalto)
const HIGHWAY_MEDIAN_W      = 4.0       // canteiro central verde
const HIGHWAY_SIDEWALK_W    = 1.5       // calçada/acostamento em cada lado externo
const HIGHWAY_PAINT_W       = 0.25      // largura das faixas pintadas (amarela interna / branca externa)
// Semi-largura total (asfalto + canteiro/2). NÃO inclui sidewalk.
const HIGHWAY_HALF_W        = HIGHWAY_LANE_W + HIGHWAY_MEDIAN_W / 2
// Semi-largura total incluindo sidewalks (usado pra flatten do terreno em volta)
const HIGHWAY_HALF_TOTAL    = HIGHWAY_HALF_W + HIGHWAY_SIDEWALK_W
const HIGHWAY_FLAT_INNER    = HIGHWAY_HALF_TOTAL + 1.5
const HIGHWAY_FLAT_OUTER    = HIGHWAY_HALF_TOTAL + 8
const HIGHWAY_STRAIGHT_RADIUS = 90      // anchors dentro desse raio de uma cidade são "puxados" pra ficar retos

// Highway-v3 streaming: parâmetros de chunk
const HIGHWAY_CHUNK_ANCHORS  = 4        // anchors renderizadas por chunk (~880u em x)
const HIGHWAY_CHUNK_W        = HIGHWAY_ANCHOR_STEP * HIGHWAY_CHUNK_ANCHORS
const HIGHWAY_CHUNK_RADIUS   = 5        // ±5 chunks ao redor do player ≈ ±4400u em x
const HIGHWAY_SEG_SAMPLES    = 8        // amostras por trecho entre 2 anchors

// Highway-v4 (Sessão 4): bifurcações perpendiculares a cada N anchors
const HIGHWAY_CROSS_PERIOD       = 12   // a cada 12 anchors ≈ 2640u
const HIGHWAY_CROSS_HALF_LENGTH  = 180  // estende ±180u perpendicular à principal
const HIGHWAY_CROSS_SAMPLES      = 9    // pontos amostrados ao longo do cross

// Offset lateral da cidade em relação à backbone — fica grudada na sidewalk externa.
const CITY_LATERAL_OFFSET   = HIGHWAY_HALF_TOTAL + PLOT_RADIUS + 6

// Cidade i → { dx, dz } aplicado SOBRE o canto-do-grid pra deslocar a cidade
// até que fique ao lado da highway no eixo perpendicular à tangente local.
let _cityOffsets = new Map()  // key: cityId → { dx, dz, side: ±1, anchorIdx }

// Posição "noise" da backbone em x (Z deslocamento), em coordenadas de mundo.
// Pure function — usada tanto pra criar anchors quanto pra projetar cidades.
function _highwayBaseZ(x) {
  // noise.noise() ∈ [-1, 1] do SimplexNoise → leve dobra com componente lento
  const n = noise.noise(x * HIGHWAY_LATERAL_FREQ, 17.3) * 0.7
          + noise.noise(x * HIGHWAY_LATERAL_FREQ * 2.7, 91.1) * 0.3
  return n * HIGHWAY_LATERAL_AMP
}

// Highway-v3 streaming: posição z de uma anchor leva em conta city-pulling.
// Pure function de x + lista global de cidades → z. Mesmo x → mesmo z sempre.
// Cada cidade próxima (gx ∈ [x±HIGHWAY_STRAIGHT_RADIUS]) puxa a Z da anchor pra
// alinhar com a posição lateral desejada da cidade.
function _highwayAnchorZAtX(x, cityGrid) {
  let z = _highwayBaseZ(x)
  if (!cityGrid?.length) return z
  for (const cg of cityGrid) {
    const d = Math.abs(x - cg.gx)
    if (d > HIGHWAY_STRAIGHT_RADIUS) continue
    const t = 1 - d / HIGHWAY_STRAIGHT_RADIUS
    const w = t * t * (3 - 2 * t)
    const targetZ = cg.gz - cg.side * CITY_LATERAL_OFFSET
    z = z * (1 - w) + targetZ * w
  }
  return z
}

// Catmull-Rom CENTRIPETAL (α=0.5) segment entre p1 e p2, com control points p0 e p3.
// Função pura e local — chunks vizinhos produzem geometria IDÊNTICA na fronteira
// porque dependem só de 4 anchors consecutivas, não do total da curva.
function _catmullRomSegmentXZ(p0, p1, p2, p3, samples) {
  const out = []
  // Usa a forma uniforme catmull-rom (suficientemente suave com anchors equidistantes em x)
  for (let i = 0; i <= samples; i++) {
    const t  = i / samples
    const t2 = t * t
    const t3 = t2 * t
    const f0 = -0.5 * t3 +       t2 - 0.5 * t
    const f1 =  1.5 * t3 - 2.5 * t2          + 1
    const f2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t
    const f3 =  0.5 * t3 - 0.5 * t2
    const x = f0 * p0.x + f1 * p1.x + f2 * p2.x + f3 * p3.x
    const z = f0 * p0.z + f1 * p1.z + f2 * p2.z + f3 * p3.z
    out.push(new Vector3(x, 0, z))
  }
  return out
}

// Centro do "tile inicial" do grid 5×5 da cidade (mesma fórmula usada pra colocar buildings).
// É a posição "default" antes de aplicar offset lateral pra cima da highway.
function _cityGridCenter(city) {
  const tileSize = (WORLD_SCALE - 2 * HALF_ROAD_TOTAL) / 5
  const offset   = HALF_ROAD_TOTAL + tileSize
  return {
    x: city.worldX * WORLD_SCALE + offset,
    z: city.worldZ * WORLD_SCALE + offset,
  }
}

/** Posição visual final da cidade no WorldView (após reposicionamento adjacente à highway). */
function cityVisualPos(city) {
  const base = _cityGridCenter(city)
  const off  = _cityOffsets.get(city.id ?? city.userId)
  if (off) {
    return new Vector3(base.x + off.dx, 0, base.z + off.dz)
  }
  return new Vector3(base.x, 0, base.z)
}

function _lerp(a, b, t) { return a + (b - a) * t }

// ── Composable ────────────────────────────────────────────────────────────────
export function useWorldRenderer(canvasRef) {
  let renderer, scene, orthoCamera, perspCamera, camera, animId
  let camFrustum = 20
  let lastTime   = 0
  let cameraMode = 0

  // Day/night state
  let dayTime    = 0.30
  let skyMesh    = null
  let starPointsBright = null
  let moonMesh        = null
  let cloudMesh  = null
  let starPoints = null
  let ambLight   = null
  let hemiLight  = null
  let sunLight   = null

  const _phase   = { top: new Color(), bot: new Color(), sun: new Color(), fog: new Color(), aI: 0, hI: 0, sI: 0, fd: 0, st: 0 }
  const _bgColor = new Color()

  const keysDown     = new Set()
  const roadSegments = []
  const ambientCars  = []
  // Lista de groups de veg-chunks { meshes: [], cx, cz } — cx/cz em coords de mundo
  const _vegChunks   = []

  // ── Free camera control (mouse look) ────────────────────────────────────────
  let freeCamPitch = 0       // Up/down rotation (radians)
  let freeCamYaw   = 0       // Left/right rotation (radians)
  let freeCamRadius = 10     // Distance from player
  let freeCamHeight = 2      // Height above player
  const freeCamDrag = { active: false, lastX: 0, lastY: 0 }
  const freeCamSpeed = 0.003 // Mouse sensitivity

  let mode = 'walking'

  const npc = {
    group: null,
    pos:   new Vector3(0, 0, 8),
    angle: 0,
    speed: 0,
    maxSpeed: 5.5, accel: 18, friction: 14, turnSpeed: 3.2,
  }
  const WHEEL_RADIUS = 0.35 // raio estimado das rodas em unidades de mundo

  const vehicle = {
    mesh:        null,
    wheelMeshes: [],          // nós GLB cujo nome contém 'wheel'
    pos:         new Vector3(0, 0, 0),
    groundY:     0.42,        // 0 para GLB, 0.42 para box
    angle: 0,
    speed: 0,
    maxSpeed: 15, accel: 24, friction: 9, turnSpeed: 2.3,
  }

  const camPos    = new Vector3()
  const camLookAt = new Vector3()

  const ready         = ref(false)
  const nearbyCity    = ref(null)
  const enterCityZone = ref(null)
  const playerPos     = ref({ x: 0, z: 0 })
  const playerMode    = ref('walking')
  const cameraModeRef = ref(0)
  const timeOfDay     = ref('07:12')


  function _buildCameras(W, H) {
    const a = W / H
    orthoCamera = new OrthographicCamera(-camFrustum * a, camFrustum * a, camFrustum, -camFrustum, 0.1, 1200)
    perspCamera = new PerspectiveCamera(65, a, 0.1, 1200)
    camera = orthoCamera
    camPos.set(npc.pos.x + 20, 20, npc.pos.z + 20)
    camLookAt.copy(npc.pos)
    camera.position.copy(camPos)
    camera.lookAt(camLookAt)
  }

  function _buildLights() {
    ambLight = new AmbientLight(0xffffff, 0.78)
    scene.add(ambLight)
    hemiLight = new HemisphereLight(0xb8d4a0, 0x2a4a1a, 0.38)
    scene.add(hemiLight)
    sunLight = new DirectionalLight(0xfff4d6, 1.0)
    sunLight.position.set(40, 80, 30)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.set(2048, 2048)
    Object.assign(sunLight.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150 })
    scene.add(sunLight)
  }

  // ── Sky dome ──────────────────────────────────────────────────────────────────
  function _buildSky() {
    const mat = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTopColor: { value: new Color(0x04081a) },
        uBotColor: { value: new Color(0x060c20) },
        uSunDir:   { value: new Vector3(0, 1, 0.3) },
        uSunColor: { value: new Color(0xffffff) },
        uSunSize:  { value: 0.9994 },
      },
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform vec3  uTopColor;
        uniform vec3  uBotColor;
        uniform vec3  uSunDir;
        uniform vec3  uSunColor;
        uniform float uSunSize;
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          float h = pow(max(d.y, 0.0), 0.5);
          vec3 sky = mix(uBotColor, uTopColor, h);
          float cosA = dot(d, normalize(uSunDir));
          float disc = smoothstep(uSunSize - 0.0008, uSunSize + 0.0008, cosA);
          float halo = smoothstep(uSunSize - 0.07, uSunSize - 0.002, cosA) * 0.32;
          sky += uSunColor * disc + uSunColor * halo * 0.5;
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
    })
    skyMesh = new Mesh(new SphereGeometry(700, 32, 16), mat)
    skyMesh.renderOrder = -1
    scene.add(skyMesh)
  }

  function _buildClouds() {
    const mat = new ShaderMaterial({
      side: BackSide,
      depthWrite: false,
      fog: false,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */`
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uTime;
        varying vec3 vPos;

        // Value noise: hash returns float in [0,1]
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }

        // Trilinear value noise, output in [0, 1]
        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i),               hash(i+vec3(1,0,0)), f.x),
                mix(hash(i+vec3(0,1,0)),   hash(i+vec3(1,1,0)), f.x), f.y),
            mix(mix(hash(i+vec3(0,0,1)),   hash(i+vec3(1,0,1)), f.x),
                mix(hash(i+vec3(0,1,1)),   hash(i+vec3(1,1,1)), f.x), f.y),
            f.z
          );
        }

        void main() {
          vec3 dir = normalize(vPos);
          float y = dir.y;

          // Only upper hemisphere
          if (y < 0.05) { gl_FragColor = vec4(0.0); return; }

          // Project ray to cloud layer plane (height band)
          float h = 0.35 / max(y, 0.05);
          vec3 p = dir * h;
          p.x += uTime * 0.015;
          p.z += uTime * 0.008;
          p *= 2.5;

          // FBM – each octave is strictly [0, 1], sum is [0, 1.75], divided → [0, 1]
          float n = 0.0;
          n += 1.000 * noise(p);
          n += 0.500 * noise(p * 2.0 + vec3(1.7, 9.2, 3.5));
          n += 0.250 * noise(p * 4.0 + vec3(8.3, 2.8, 5.1));
          n /= 1.75;

          // Cloud shape with gentle threshold
          float cloud = smoothstep(0.48, 0.68, n);

          // Fade softly at horizon
          float fade = smoothstep(0.05, 0.18, y);
          cloud *= fade;

          if (cloud < 0.01) { gl_FragColor = vec4(0.0); return; }

          // Slight shading: center brighter, edges slightly grey
          float shade = mix(0.88, 1.0, cloud);
          gl_FragColor = vec4(shade, shade, shade, cloud * 0.92);
        }
      `,
    })

    cloudMesh = new Mesh(new SphereGeometry(680, 32, 16), mat)
    cloudMesh.renderOrder = 1   // render after sky (renderOrder -1)
    scene.add(cloudMesh)
  }

  function _updateClouds(dt) {
    if (cloudMesh) {
      cloudMesh.material.uniforms.uTime.value += dt
    }
  }

  function _buildStars() {
    // Camada 1: estrelas finas (numerosas) — base do céu noturno
    const count = 4500
    const pos   = new Float32Array(count * 3)
    const rng   = seededRng(0x57a715)
    for (let i = 0; i < count; i++) {
      const theta = rng() * Math.PI * 2
      const phi   = Math.acos(2 * rng() - 1)
      const r     = 650
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta))
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
    const mat = new PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0 })
    starPoints = new Points(geo, mat)
    starPoints.renderOrder = -1
    scene.add(starPoints)

    // Camada 2: estrelas brilhantes destacadas (poucas, maiores)
    const brightCount = 180
    const bpos = new Float32Array(brightCount * 3)
    for (let i = 0; i < brightCount; i++) {
      const theta = rng() * Math.PI * 2
      const phi   = Math.acos(2 * rng() - 1)
      const r     = 640
      bpos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      bpos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta))
      bpos[i * 3 + 2] = r * Math.cos(phi)
    }
    const bgeo = new BufferGeometry()
    bgeo.setAttribute('position', new Float32BufferAttribute(bpos, 3))
    const bmat = new PointsMaterial({ color: 0xfff4d6, size: 4.2, sizeAttenuation: false, transparent: true, opacity: 0 })
    starPointsBright = new Points(bgeo, bmat)
    starPointsBright.renderOrder = -1
    scene.add(starPointsBright)

    // Lua: esfera emissive grande no céu noturno
    const moonGeo = new SphereGeometry(28, 24, 16)
    const moonMat = new MeshBasicMaterial({ color: 0xfaf0d8, transparent: true, opacity: 0 })
    moonMesh = new Mesh(moonGeo, moonMat)
    moonMesh.position.set(380, 320, -420)
    moonMesh.renderOrder = -1
    scene.add(moonMesh)
  }

  // ── Day/night cycle ───────────────────────────────────────────────────────────
  function _getDayPhase(t) {
    let i = 0
    while (i < PHASES.length - 2 && PHASES[i + 1].t <= t) i++
    const a = PHASES[i], b = PHASES[i + 1]
    const f = (b.t > a.t) ? (t - a.t) / (b.t - a.t) : 0
    _phase.top.copy(a.top).lerp(b.top, f)
    _phase.bot.copy(a.bot).lerp(b.bot, f)
    _phase.sun.copy(a.sun).lerp(b.sun, f)
    _phase.fog.copy(a.fog).lerp(b.fog, f)
    _phase.aI = _lerp(a.aI, b.aI, f)
    _phase.hI = _lerp(a.hI, b.hI, f)
    _phase.sI = _lerp(a.sI, b.sI, f)
    _phase.fd = _lerp(a.fd, b.fd, f)
    _phase.st = _lerp(a.st, b.st, f)
  }

  function _updateDayNight(dt) {
    dayTime = (dayTime + DAY_SPEED * dt) % 1
    _getDayPhase(dayTime)

    // Sun orbits: dayTime=0.25→east horizon, 0.5→zenith, 0.75→west horizon
    const sa  = (dayTime - 0.25) * Math.PI * 2
    const sx  = Math.cos(sa), sy = Math.sin(sa), sz = 0.25
    const isSun = sy > -0.1
    const dx = isSun ? sx : -sx
    const dy = isSun ? sy : -sy
    const dz = isSun ? sz : -sz

    if (skyMesh) {
      const u = skyMesh.material.uniforms
      u.uTopColor.value.copy(_phase.top)
      u.uBotColor.value.copy(_phase.bot)
      u.uSunDir.value.set(dx, dy, dz)
      u.uSunColor.value.copy(_phase.sun)
    }

    _bgColor.copy(_phase.fog)
    scene.fog.color.copy(_phase.fog)
    scene.fog.density = _phase.fd

    if (ambLight)  ambLight.intensity  = _phase.aI
    if (hemiLight) hemiLight.intensity = _phase.hI
    if (sunLight) {
      sunLight.intensity = _phase.sI
      sunLight.color.copy(_phase.sun)
      sunLight.position.set(dx * 150, Math.max(dy, 0.12) * 150, dz * 150)
    }

    if (starPoints) starPoints.material.opacity = _phase.st
    if (starPointsBright) starPointsBright.material.opacity = _phase.st
    if (moonMesh) moonMesh.material.opacity = _phase.st

    const h = Math.floor(dayTime * 24)
    const m = Math.floor(((dayTime * 24) % 1) * 60)
    timeOfDay.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  // ── World generation ───────────────────────────────────────────────────────────
  function loadWorld(cities, { activeVehicle = null, vehicleCatalog = [], adjacencies = [] } = {}) {
    // 1) Constrói highway network ANTES — calcula offsets de cidade.
    //    cityVisualPos() depende de _cityOffsets, então isso vem primeiro.
    _buildHighwayNetwork(cities)

    // 2) Agora _cityCenters usa cityVisualPos (já com offsets aplicados)
    _cityCenters = cities.map(c => {
      const p = cityVisualPos(c)
      return { x: p.x, z: p.z }
    })

    // adjacencies do backend não é mais usado pra desenhar estradas — só pra info.
    void adjacencies

    // Detecta picos e traça rios (gradient descent) — também antes do terreno pro carving entrar em heightAt
    _generateRivers()

    // IMPORTANTE: catalog de veículos precisa estar disponível ANTES do primeiro _updateHighwayStreaming,
    // senão os chunks iniciais spawnam caixas (fallback) por falta de modelo GLB.
    _vehicleCatalogGlobal = vehicleCatalog

    // Highway: constrói chunks ao redor da origem ANTES do terreno, pra que o worker
    // já receba flatRoads populado e aplique o flatten do asfalto desde o primeiro chunk.
    _updateHighwayStreaming(0)

    // Terreno principal vai pro Web Worker (libera main thread durante "Gerando mundo...").
    // O resto (estradas/rios/vegetação) usa heightAt local sincronamente — volumes pequenos.
    return _generateTerrainAsync().then(() => {
      _generateRoads()
      _generateRiverRibbons()
      _generateVegetation(cities)
      _generateCityPlots(cities)
      _spawnAmbientCars(vehicleCatalog)
      _spawnVehicle(activeVehicle)
      _spawnNpc()
    })
  }

  function _polylinesToFlat(polylines) {
    return polylines.map(pl => {
      const flat = new Float32Array(pl.points.length * 2)
      for (let i = 0; i < pl.points.length; i++) {
        flat[i * 2]     = pl.points[i].x
        flat[i * 2 + 1] = pl.points[i].z
      }
      // heights (road centerline) e widths (rios) são opcionais
      const heights = pl.heights ? new Float32Array(pl.heights) : null
      const widths  = pl.widths  ? new Float32Array(pl.widths)  : null
      const result  = { points: flat }
      if (heights) result.heights = heights
      if (widths)  result.widths  = widths
      return result
    })
  }

  function _generateTerrainAsync() {
    // Inicializa streaming de chunks (PR 7): cria worker pool e spawn dos primeiros chunks
    // ao redor da origem. Resolve a Promise quando o ring inicial estiver pronto, pra UI sair
    // do "Gerando mundo..."; o resto continua aparecendo conforme a câmera move.
    return new Promise((resolve) => {
      _initChunkStreaming()
      // Cidades atuais (estáticas do DB) — passa pra worker fazer flatten
      const cityList = _cityCenters.map(c => ({ x: c.x, z: c.z }))
      const flatRoads  = _polylinesToFlat(_roadPolylines)
      const flatRivers = _polylinesToFlat(_riverPolylines)
      const lakes = _lakeCenters.map(l => ({ x: l.x, z: l.z, radius: l.radius }))
      _chunkStream.cities    = cityList
      _chunkStream.flatRoads = flatRoads
      _chunkStream.flatRivers = flatRivers
      _chunkStream.lakes = lakes

      // Spawn inicial: chunk em (0,0) e vizinhos imediatos (3×3). Resolve quando todos prontos.
      const initialKeys = []
      for (let dz = -1; dz <= 1; dz++) {
        for (let dx = -1; dx <= 1; dx++) {
          initialKeys.push(`${dx},${dz}`)
          _requestChunk(dx, dz, 'high')
        }
      }
      const startTs = performance.now()
      const checkReady = () => {
        const allReady = initialKeys.every(k => _chunkStream.chunks.has(k))
        if (allReady || performance.now() - startTs > 5000) {
          // Após o ring inicial: dispara um sweep completo do raio high+low
          _updateChunkStreaming(0, 0)
          resolve()
        } else {
          setTimeout(checkReady, 50)
        }
      }
      checkReady()
    })
  }

  // ──── Chunked terrain streaming ────────────────────────────────────────────
  // Estado compartilhado (criado em _initChunkStreaming, descartado em dispose)
  let _chunkStream = null

  function _initChunkStreaming() {
    if (_chunkStream) _disposeChunkStreaming()
    const workers = []
    for (let i = 0; i < CHUNK_WORKER_COUNT; i++) {
      const w = new Worker(new URL('../workers/terrain.worker.js', import.meta.url), { type: 'module' })
      w.addEventListener('message', _onChunkReady)
      workers.push(w)
    }
    _chunkStream = {
      workers,
      workerIdx: 0,
      chunks: new Map(),         // key "cx,cz" -> { mesh, lod }
      pending: new Map(),        // key -> { lod }
      cities: [],
      flatRoads: [],
      flatRivers: [],
      lakes: [],
      lastCamChunk: { x: NaN, z: NaN },
    }
  }

  function _disposeChunkStreaming() {
    if (!_chunkStream) return
    for (const w of _chunkStream.workers) {
      w.removeEventListener('message', _onChunkReady)
      w.terminate()
    }
    for (const ch of _chunkStream.chunks.values()) _destroyChunkObj(ch)
    _chunkStream.chunks.clear()
    _chunkStream.pending.clear()
    _chunkStream = null
  }

  function _destroyChunkObj(ch) {
    if (ch.mesh) {
      scene.remove(ch.mesh)
      ch.mesh.geometry.dispose()
    }
  }

  function _requestChunk(cx, cz, lod) {
    if (!_chunkStream) return
    const key = `${cx},${cz}`
    if (_chunkStream.chunks.has(key) || _chunkStream.pending.has(key)) return
    _chunkStream.pending.set(key, { lod })
    const segments = lod === 'high' ? CHUNK_SEGS_HIGH : CHUNK_SEGS_LOW
    const w = _chunkStream.workers[_chunkStream.workerIdx]
    _chunkStream.workerIdx = (_chunkStream.workerIdx + 1) % _chunkStream.workers.length
    w.postMessage({
      chunkX: cx, chunkZ: cz,
      chunkSize: CHUNK_SIZE,
      segments,
      amplitude: TERRAIN_AMPLITUDE,
      terrainFreq: TERRAIN_FREQ,
      worldScale: WORLD_SCALE,
      flattenInner: CITY_FLAT_INNER,
      flattenOuter: CITY_FLAT_OUTER,
      roadFlat: [HIGHWAY_FLAT_INNER, HIGHWAY_FLAT_OUTER],
      river: { carveInner: RIVER_CARVE_INNER, carveOuter: RIVER_CARVE_OUTER, carveDepth: RIVER_CARVE_DEPTH },
      roads:  _chunkStream.flatRoads,
      rivers: _chunkStream.flatRivers,
      lakes:  _chunkStream.lakes,
      cities: _chunkStream.cities,
      canyon: { freq: CANYON_FREQ, threshold: CANYON_THRESHOLD, depth: CANYON_DEPTH, cliffWindow: CANYON_CLIFF_WINDOW },
      mountainPeak: { threshold: MOUNTAIN_PEAK_THRESHOLD, height: MOUNTAIN_PEAK_HEIGHT },
      mountainCanyon: {
        freq: MOUNTAIN_CANYON_FREQ,
        threshold: MOUNTAIN_CANYON_THRESHOLD,
        depth: MOUNTAIN_CANYON_DEPTH,
      },
      mountainWarpAmp: MOUNTAIN_WARP_AMP,
      mesa: { step: MESA_STEP, mix: MESA_MIX },
      noiseSeed: TERRAIN_NOISE_SEED,
    })
  }

  function _onChunkReady(ev) {
    if (!_chunkStream) return
    const { chunkX, chunkZ, heights, colors } = ev.data
    const key = `${chunkX},${chunkZ}`
    const meta = _chunkStream.pending.get(key)
    _chunkStream.pending.delete(key)
    if (!meta) return // chunk descartado antes de chegar

    const segments = meta.lod === 'high' ? CHUNK_SEGS_HIGH : CHUNK_SEGS_LOW
    const geo = new PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, segments, segments)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) pos.setZ(i, heights[i])
    pos.needsUpdate = true
    geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    const mesh = new Mesh(geo, _chunkMaterial())
    mesh.rotation.x = -Math.PI / 2
    mesh.receiveShadow = true
    mesh.position.set(chunkX * CHUNK_SIZE + CHUNK_SIZE / 2, 0, chunkZ * CHUNK_SIZE + CHUNK_SIZE / 2)
    scene.add(mesh)

    _chunkStream.chunks.set(key, { mesh, lod: meta.lod })
  }

  // Material compartilhado pra evitar criar 1 por chunk
  let _sharedChunkMat = null
  function _chunkMaterial() {
    if (!_sharedChunkMat) _sharedChunkMat = new MeshLambertMaterial({ vertexColors: true })
    return _sharedChunkMat
  }

  /**
   * Chamado por tick(). Spawna chunks dentro de raio (high + low LOD) e descarta
   * chunks distantes. Throttled: só recomputa quando a câmera muda de chunk.
   */
  function _updateChunkStreaming(camX, camZ) {
    if (!_chunkStream) return
    const cx = Math.floor(camX / CHUNK_SIZE)
    const cz = Math.floor(camZ / CHUNK_SIZE)
    if (cx === _chunkStream.lastCamChunk.x && cz === _chunkStream.lastCamChunk.z) return
    _chunkStream.lastCamChunk = { x: cx, z: cz }

    // Mark desired chunks + LOD
    const desired = new Map()  // key -> 'high' | 'low'
    for (let dz = -CHUNK_RADIUS_LOW; dz <= CHUNK_RADIUS_LOW; dz++) {
      for (let dx = -CHUNK_RADIUS_LOW; dx <= CHUNK_RADIUS_LOW; dx++) {
        const r = Math.max(Math.abs(dx), Math.abs(dz))
        if (r > CHUNK_RADIUS_LOW) continue
        const lod = r <= CHUNK_RADIUS_HIGH ? 'high' : 'low'
        desired.set(`${cx + dx},${cz + dz}`, lod)
      }
    }

    // Dispose chunks fora do raio ou com LOD diferente
    for (const [key, ch] of _chunkStream.chunks) {
      const want = desired.get(key)
      if (!want) {
        _destroyChunkObj(ch)
        _chunkStream.chunks.delete(key)
      } else if (want !== ch.lod) {
        _destroyChunkObj(ch)
        _chunkStream.chunks.delete(key)
        // re-request com novo LOD
        const [sx, sz] = key.split(',').map(Number)
        _requestChunk(sx, sz, want)
      }
    }

    // Cancela pending fora do raio
    for (const key of _chunkStream.pending.keys()) {
      if (!desired.has(key)) _chunkStream.pending.delete(key)
    }

    // Spawn novos chunks (prioriza high-LOD primeiro pelo Math.max radius)
    const toSpawn = []
    for (const [key, lod] of desired) {
      if (_chunkStream.chunks.has(key) || _chunkStream.pending.has(key)) continue
      const [sx, sz] = key.split(',').map(Number)
      const r = Math.max(Math.abs(sx - cx), Math.abs(sz - cz))
      toSpawn.push({ sx, sz, lod, r })
    }
    toSpawn.sort((a, b) => a.r - b.r)
    for (const t of toSpawn) _requestChunk(t.sx, t.sz, t.lod)
  }

  // ── Highway Network (Sessão highway-v3: STREAMING INFINITO) ────────────────
  // A backbone agora é infinita ao longo do eixo X. Em vez de construir uma
  // spline única, o renderer mantém um Map<chunkIdx, ChunkInfo> de chunks
  // de rodovia carregados ao redor do player.
  //
  // Determinismo: anchor Z em x = f(x, cities) é pura. Cada anchor x e suas
  // 3 vizinhas determinam unicamente a cubic Catmull-Rom do segmento — não
  // importa quantas anchors o "mundo" tem; mesmas 4 vizinhas → mesma curva.
  //
  // City offsets são computados UMA VEZ no init (cidades são finitas, vêm do
  // backend). Anchors fora do alcance de qualquer cidade usam apenas noise.
  let _highwayCityGrid = null              // cityGrid global compartilhado pelas anchors
  let _highwayChunks   = new Map()         // chunkIdx → ChunkInfo
  let _highwayLastCx   = NaN

  function _buildHighwayNetwork(cities) {
    _roadPolylines = []
    roadSegments.length = 0
    _cityOffsets = new Map()
    _highwayChunks.forEach(_destroyHighwayChunkObj)
    _highwayChunks = new Map()
    _highwayLastCx = NaN

    if (!cities?.length) {
      _highwayCityGrid = []
      return
    }

    // 1. Decide lado (hash do id) e armazena cityGrid global
    _highwayCityGrid = cities.map(c => {
      const g = _cityGridCenter(c)
      const idNum = (c.id ?? c.userId ?? 0) | 0
      const h = ((idNum * 2654435761) >>> 0) % 2
      return { city: c, gx: g.x, gz: g.z, side: h === 0 ? +1 : -1 }
    })

    // 2. Calcula offsets das cidades (função pura — não depende de chunks)
    for (const cg of _highwayCityGrid) {
      const bbZ = _highwayAnchorZAtX(cg.gx, _highwayCityGrid)
      const targetZ = bbZ + cg.side * CITY_LATERAL_OFFSET
      // tangente local: amostra anchor vizinha
      const dx = HIGHWAY_ANCHOR_STEP
      const zNext = _highwayAnchorZAtX(cg.gx + dx, _highwayCityGrid)
      const tanX = dx, tanZ = zNext - bbZ
      const tlen = Math.hypot(tanX, tanZ) || 1
      _cityOffsets.set(cg.city.id ?? cg.city.userId, {
        dx: 0,
        dz: targetZ - cg.gz,
        side: cg.side,
        spurAnchorX: cg.gx,
        spurAnchorZ: bbZ,
        bbNormalX:  tanZ / tlen,
        bbNormalZ: -tanX / tlen,
      })
    }
  }

  // Anchor i (índice global) → {x, z}. Índice 0 ≈ origem. Determinístico.
  function _highwayAnchorByIdx(i) {
    const x = i * HIGHWAY_ANCHOR_STEP
    return { x, z: _highwayAnchorZAtX(x, _highwayCityGrid) }
  }

  // Constrói chunk N: cobre anchors [N*K, (N+1)*K] inclusive (K+1 endpoints).
  // Para Catmull-Rom usa também anchors N*K-1 e (N+1)*K+1 como controles externos.
  // Retorna info já adicionada a `_roadPolylines` / `roadSegments`.
  function _buildHighwayChunk(chunkIdx) {
    if (_highwayChunks.has(chunkIdx)) return
    const K = HIGHWAY_CHUNK_ANCHORS
    const startA = chunkIdx * K
    const endA   = startA + K       // inclusive — chunk renderiza K segmentos

    // Anchors com 1 ghost-seg de overlap em cada lado pra suavizar altura entre chunks.
    // Range [startA-2, endA+2] = K+5 anchors. Cada chunk amostra K+2 segs.
    const anchors = []
    for (let i = startA - 2; i <= endA + 2; i++) anchors.push(_highwayAnchorByIdx(i))

    const extendedPoints = []
    // s=0 = ghost esq, s=1..K = reais, s=K+1 = ghost dir. P/seg s: p0..p3 = anchors[s..s+3].
    // Ambos os chunks vizinhos usam os MESMOS 4 anchors globais para o seg compartilhado,
    // garantindo samples e heights idênticas na fronteira.
    for (let s = 0; s <= K + 1; s++) {
      const p0 = anchors[s]
      const p1 = anchors[s + 1]
      const p2 = anchors[s + 2]
      const p3 = anchors[s + 3]
      const seg = _catmullRomSegmentXZ(p0, p1, p2, p3, HIGHWAY_SEG_SAMPLES)
      const startK = (s === 0) ? 0 : 1
      for (let k = startK; k < seg.length; k++) extendedPoints.push(seg[k])
    }

    // Real chunk começa no endpoint do ghost esquerdo = anchor startA = index HIGHWAY_SEG_SAMPLES
    const realStartIdx = HIGHWAY_SEG_SAMPLES
    const realCount    = K * HIGHWAY_SEG_SAMPLES + 1
    const points = extendedPoints.slice(realStartIdx, realStartIdx + realCount)

    // Alturas suavizadas (9-tap) usando contexto estendido
    const rawHExt = extendedPoints.map(p => _heightBaseAt(p.x, p.z))
    const heights = points.map((_, i) => {
      const ei = realStartIdx + i
      let sum = 0, cnt = 0
      for (let k = Math.max(0, ei - 4); k <= Math.min(rawHExt.length - 1, ei + 4); k++) {
        sum += rawHExt[k]; cnt++
      }
      return sum / cnt
    })

    // Tangentes determinísticas: pra cada ponto real, calcula tangente usando vizinhos
    // do extendedPoints (com ghost). Isso garante que o normal lateral seja IGUAL nos
    // pontos de fronteira entre chunks, eliminando degrau lateral em sidewalks/paint.
    const tangents = points.map((_, i) => {
      const ei = realStartIdx + i
      const a = extendedPoints[Math.max(0, ei - 1)]
      const b = extendedPoints[Math.min(extendedPoints.length - 1, ei + 1)]
      const tx = b.x - a.x, tz = b.z - a.z
      const tl = Math.hypot(tx, tz) || 1
      return { x: tx / tl, z: tz / tl }
    })

    let polyLen = 0
    for (let i = 1; i < points.length; i++) polyLen += points[i].distanceTo(points[i - 1])

    // Para spawning de carros precisamos de uma "curve" mock com getPointAt/getTangentAt.
    // Como já temos pontos amostrados, criamos um wrapper que faz lookup linear nesses pontos.
    const curve = _makePolylineCurve(points, polyLen)

    const poly = { points, length: polyLen, heights, kind: 'highway' }
    const segment = { curve, points, length: polyLen, heights, tangents, kind: 'highway', chunkIdx }

    _roadPolylines.push(poly)
    roadSegments.push(segment)

    const info = { poly, segment, meshes: [], cars: [], chunkIdx }
    _highwayChunks.set(chunkIdx, info)

    // Renderiza meshes desse chunk
    _renderHighwayChunkMeshes(info)

    // Cars ambiente desse chunk
    _spawnAmbientCarsForSegment(info)

    // Sync polylines flat → worker (próximos terrain chunks usarão polylines atualizadas)
    if (_chunkStream) _chunkStream.flatRoads = _polylinesToFlat(_roadPolylines)
  }

  // Wrapper compatível com seg.curve.getPointAt(t) / getTangentAt(t) usando interpolação linear
  function _makePolylineCurve(points, length) {
    const segLens = []
    let acc = 0
    for (let i = 1; i < points.length; i++) {
      const d = points[i].distanceTo(points[i - 1])
      acc += d
      segLens.push(acc)
    }
    const totalLen = acc || 1
    function getPointAt(u) {
      const target = Math.max(0, Math.min(1, u)) * totalLen
      let lo = 0, hi = segLens.length - 1
      while (lo < hi) {
        const mid = (lo + hi) >> 1
        if (segLens[mid] < target) lo = mid + 1
        else hi = mid
      }
      const idx = lo
      const prev = idx === 0 ? 0 : segLens[idx - 1]
      const t = (target - prev) / Math.max(0.0001, segLens[idx] - prev)
      const a = points[idx], b = points[idx + 1]
      return new Vector3(a.x + (b.x - a.x) * t, 0, a.z + (b.z - a.z) * t)
    }
    function getTangentAt(u) {
      // tangente = diferença entre dois sample points próximos (estável)
      const eps = 1e-3
      const a = getPointAt(Math.max(0, u - eps))
      const b = getPointAt(Math.min(1, u + eps))
      const tx = b.x - a.x, tz = b.z - a.z
      const tl = Math.hypot(tx, tz) || 1
      return new Vector3(tx / tl, 0, tz / tl)
    }
    return { getPointAt, getTangentAt, length: totalLen }
    // (length unused mas mantido pra compat)
  }

  function _destroyHighwayChunkObj(info) {
    if (!info) return
    for (const m of info.meshes) {
      scene.remove(m)
      m.geometry?.dispose?.()
    }
    for (const c of info.cars) {
      scene.remove(c)
      const gi = ambientCars.indexOf(c)
      if (gi >= 0) ambientCars.splice(gi, 1)
    }
    // remove polyline e segment dos arrays globais
    const pi = _roadPolylines.indexOf(info.poly)
    if (pi >= 0) _roadPolylines.splice(pi, 1)
    const si = roadSegments.indexOf(info.segment)
    if (si >= 0) roadSegments.splice(si, 1)
    // Cross-polylines (Sessão 4)
    if (info.crossPolys) {
      for (const cp of info.crossPolys) {
        const idx = _roadPolylines.indexOf(cp)
        if (idx >= 0) _roadPolylines.splice(idx, 1)
      }
    }
  }

  function _disposeHighwayChunk(chunkIdx) {
    const info = _highwayChunks.get(chunkIdx)
    if (!info) return
    _destroyHighwayChunkObj(info)
    _highwayChunks.delete(chunkIdx)
    if (_chunkStream) _chunkStream.flatRoads = _polylinesToFlat(_roadPolylines)
  }

  // Streaming: chamado por tick(). Carrega chunks ±RADIUS ao redor do player.
  function _updateHighwayStreaming(camX) {
    const cx = Math.floor(camX / HIGHWAY_CHUNK_W)
    if (cx === _highwayLastCx) return
    _highwayLastCx = cx

    const desired = new Set()
    for (let d = -HIGHWAY_CHUNK_RADIUS; d <= HIGHWAY_CHUNK_RADIUS; d++) desired.add(cx + d)

    // Dispose chunks fora do raio
    for (const idx of [..._highwayChunks.keys()]) {
      if (!desired.has(idx)) _disposeHighwayChunk(idx)
    }
    // Spawn novos (do mais próximo pro mais distante)
    const toSpawn = [...desired].filter(i => !_highwayChunks.has(i))
    toSpawn.sort((a, b) => Math.abs(a - cx) - Math.abs(b - cx))
    for (const idx of toSpawn) _buildHighwayChunk(idx)
  }

  // Wrapper retrocompatível.
  function _buildRoadCurves(cities, _adjacencies) {
    _buildHighwayNetwork(cities)
  }

  // Renderiza meshes (ribbons + bridges) de UM chunk de highway.
  function _renderHighwayChunkMeshes(info) {
    const seg = info.segment
    const pts = seg.points
    const segCount = pts.length - 1

    const HALF_MEDIAN  = HIGHWAY_MEDIAN_W / 2
    const HALF_LANE    = HIGHWAY_LANE_W / 2
    const c_pistaL     =  (HALF_MEDIAN + HALF_LANE)
    const c_pistaR     = -(HALF_MEDIAN + HALF_LANE)
    const c_paintYL    =  (HALF_MEDIAN + HIGHWAY_PAINT_W / 2)
    const c_paintYR    = -(HALF_MEDIAN + HIGHWAY_PAINT_W / 2)
    const c_paintWL    =  (HALF_MEDIAN + HIGHWAY_LANE_W - HIGHWAY_PAINT_W / 2)
    const c_paintWR    = -(HALF_MEDIAN + HIGHWAY_LANE_W - HIGHWAY_PAINT_W / 2)
    const c_sideL      =  (HALF_MEDIAN + HIGHWAY_LANE_W + HIGHWAY_SIDEWALK_W / 2)
    const c_sideR      = -(HALF_MEDIAN + HIGHWAY_LANE_W + HIGHWAY_SIDEWALK_W / 2)

    const out = info.meshes
    const push = (m) => { if (m) out.push(m) }

    push(_buildOffsetRibbon(pts, segCount, 0,         HIGHWAY_MEDIAN_W,   _hwMat.median,   seg, 0.04))
    push(_buildOffsetRibbon(pts, segCount, c_pistaL,  HIGHWAY_LANE_W,     _hwMat.asphalt,  seg, 0.02))
    push(_buildOffsetRibbon(pts, segCount, c_pistaR,  HIGHWAY_LANE_W,     _hwMat.asphalt,  seg, 0.02))
    push(_buildOffsetRibbon(pts, segCount, c_paintYL, HIGHWAY_PAINT_W,    _hwMat.yellow,   seg, 0.05))
    push(_buildOffsetRibbon(pts, segCount, c_paintYR, HIGHWAY_PAINT_W,    _hwMat.yellow,   seg, 0.05))
    push(_buildOffsetRibbon(pts, segCount, c_paintWL, HIGHWAY_PAINT_W,    _hwMat.white,    seg, 0.05))
    push(_buildOffsetRibbon(pts, segCount, c_paintWR, HIGHWAY_PAINT_W,    _hwMat.white,    seg, 0.05))
    push(_buildOffsetRibbon(pts, segCount, c_sideL,   HIGHWAY_SIDEWALK_W, _hwMat.sidewalk, seg, 0.18))
    push(_buildOffsetRibbon(pts, segCount, c_sideR,   HIGHWAY_SIDEWALK_W, _hwMat.sidewalk, seg, 0.18))

    // Pontes / túneis
    const { bridges, tunnels } = _detectStructures(seg)
    for (const br of bridges) _buildBridgeStructure(seg, br, out)
    if (tunnels.length) {
      // TODO sessão 4 — visual de túneis depende de não-aplainamento no worker.
    }

    // Highway-v4: bifurcações perpendiculares determinísticas
    // Para cada anchor neste chunk (índices globais startA..endA-1) cujo índice
    // seja múltiplo de HIGHWAY_CROSS_PERIOD (exceto 0), gera uma cross-highway.
    const K = HIGHWAY_CHUNK_ANCHORS
    const startA = info.chunkIdx * K
    const endA   = startA + K
    for (let ai = startA; ai < endA; ai++) {
      if (ai === 0) continue
      if (ai % HIGHWAY_CROSS_PERIOD !== 0) continue
      _buildCrossHighway(ai, info)
    }
  }

  // Bifurcação perpendicular à highway principal centrada na anchor `anchorIdx`.
  // Geometria simples: 1 ribbon de asfalto + 2 sidewalks laterais + faixas amarelas.
  function _buildCrossHighway(anchorIdx, info) {
    const center = _highwayAnchorByIdx(anchorIdx)
    const nxt    = _highwayAnchorByIdx(anchorIdx + 1)
    const prv    = _highwayAnchorByIdx(anchorIdx - 1)
    const tx = nxt.x - prv.x, tz = nxt.z - prv.z
    const tl = Math.hypot(tx, tz) || 1
    // Perpendicular à tangente
    const perpX = -tz / tl
    const perpZ =  tx / tl

    // Pontos amostrados ao longo do cross (de -HALF a +HALF, passando pelo centro)
    const N = HIGHWAY_CROSS_SAMPLES
    const points = []
    const rawH = []
    for (let i = 0; i < N; i++) {
      const t = (i / (N - 1)) * 2 - 1                      // -1..+1
      const d = t * HIGHWAY_CROSS_HALF_LENGTH
      const px = center.x + perpX * d
      const pz = center.z + perpZ * d
      points.push(new Vector3(px, 0, pz))
      rawH.push(_heightBaseAt(px, pz))
    }
    // Heights suavizadas (5-tap)
    const heights = rawH.map((_, i) => {
      let sum = 0, cnt = 0
      for (let k = Math.max(0, i - 2); k <= Math.min(rawH.length - 1, i + 2); k++) {
        sum += rawH[k]; cnt++
      }
      return sum / cnt
    })

    // Garante que o cross passa pela altura da highway principal no centro
    const centerIdx = (N - 1) >> 1
    const mainH = info.segment.heights[Math.floor(info.segment.points.length / 2)] // aproximação
    // Suaviza a transição: blend linear de altura entre centro (mainH) e extremos
    for (let i = 0; i < N; i++) {
      const w = 1 - Math.abs((i - centerIdx) / centerIdx) // 1 no centro, 0 nas pontas
      heights[i] = heights[i] * (1 - w * 0.7) + mainH * (w * 0.7)
    }

    // Tangentes (constantes ao longo do cross — é reta)
    const tangents = points.map(() => ({ x: perpX, z: perpZ }))

    let polyLen = 0
    for (let i = 1; i < points.length; i++) polyLen += points[i].distanceTo(points[i - 1])

    const crossSeg = { points, length: polyLen, heights, tangents, kind: 'cross', chunkIdx: info.chunkIdx, anchorIdx }
    const crossPoly = { points, length: polyLen, heights, kind: 'cross' }

    _roadPolylines.push(crossPoly)
    info.crossPolys = info.crossPolys || []
    info.crossPolys.push(crossPoly)

    // Render ribbons: asfalto (2 faixas + canteiro), faixas amarelas, sidewalks
    const out = info.meshes
    const segCount = points.length - 1
    const HALF_MEDIAN = HIGHWAY_MEDIAN_W / 2
    const HALF_LANE   = HIGHWAY_LANE_W / 2
    const c_pistaL    =  (HALF_MEDIAN + HALF_LANE)
    const c_pistaR    = -(HALF_MEDIAN + HALF_LANE)
    const c_paintYL   =  (HALF_MEDIAN + HIGHWAY_PAINT_W / 2)
    const c_paintYR   = -(HALF_MEDIAN + HIGHWAY_PAINT_W / 2)
    const c_sideL     =  (HALF_MEDIAN + HIGHWAY_LANE_W + HIGHWAY_SIDEWALK_W / 2)
    const c_sideR     = -(HALF_MEDIAN + HIGHWAY_LANE_W + HIGHWAY_SIDEWALK_W / 2)

    out.push(_buildOffsetRibbon(points, segCount, 0,         HIGHWAY_MEDIAN_W,   _hwMat.median,   crossSeg, 0.04))
    out.push(_buildOffsetRibbon(points, segCount, c_pistaL,  HIGHWAY_LANE_W,     _hwMat.asphalt,  crossSeg, 0.02))
    out.push(_buildOffsetRibbon(points, segCount, c_pistaR,  HIGHWAY_LANE_W,     _hwMat.asphalt,  crossSeg, 0.02))
    out.push(_buildOffsetRibbon(points, segCount, c_paintYL, HIGHWAY_PAINT_W,    _hwMat.yellow,   crossSeg, 0.05))
    out.push(_buildOffsetRibbon(points, segCount, c_paintYR, HIGHWAY_PAINT_W,    _hwMat.yellow,   crossSeg, 0.05))
    out.push(_buildOffsetRibbon(points, segCount, c_sideL,   HIGHWAY_SIDEWALK_W, _hwMat.sidewalk, crossSeg, 0.18))
    out.push(_buildOffsetRibbon(points, segCount, c_sideR,   HIGHWAY_SIDEWALK_W, _hwMat.sidewalk, crossSeg, 0.18))
  }

  // Materiais compartilhados (criados lazy)
  const _hwMat = {
    get asphalt()  { return this._a   ||= new MeshLambertMaterial({ color: 0x1c1c24 }) },
    get median()   { return this._m   ||= new MeshLambertMaterial({ color: 0x3d6e2a }) },
    get sidewalk() { return this._s   ||= new MeshLambertMaterial({ color: 0x8a8a92 }) },
    get yellow()   { return this._y   ||= new MeshLambertMaterial({ color: 0xffd166 }) },
    get white()    { return this._w   ||= new MeshLambertMaterial({ color: 0xeeeeee }) },
    get pillar()   { return this._p   ||= new MeshLambertMaterial({ color: 0x6b6b73 }) },
    get rail()     { return this._r   ||= new MeshLambertMaterial({ color: 0xc4c4cc }) },
  }

  // _generateRoads agora apenas inicializa os chunks ao redor da origem.
  function _generateRoads() {
    _updateHighwayStreaming(0)
  }

  // Constrói uma ribbon mesh ao longo de pts, com `width` de largura, deslocada
  // perpendicular à centerline em `centerOffset` (positivo = "esquerda", negativo = "direita").
  // `yLift` empilha verticalmente (asfalto 0.02, canteiro 0.04, pintura 0.05, sidewalk 0.18).
  function _buildOffsetRibbon(pts, segCount, centerOffset, width, material, seg, yLift = 0.02) {
    const posArr = new Float32Array((segCount + 1) * 2 * 3)
    const idxArr = new Uint16Array(segCount * 6)
    const halfW  = width / 2

    for (let i = 0; i <= segCount; i++) {
      const p  = pts[i]
      let nx, nz
      if (seg.tangents && seg.tangents[i]) {
        // Tangente pré-computada (determinística entre chunks) → normal compartilhada na fronteira
        const t = seg.tangents[i]
        nx = -t.z; nz = t.x
      } else {
        const pn = pts[Math.min(i + 1, segCount)]
        const pp = pts[Math.max(i - 1, 0)]
        const tx = pn.x - pp.x, tz = pn.z - pp.z
        const tl = Math.hypot(tx, tz) || 1
        nx = -tz / tl; nz = tx / tl
      }

      const gy = (seg.heights ? seg.heights[i] : heightAt(p.x, p.z)) + yLift

      const cx = p.x + nx * centerOffset
      const cz = p.z + nz * centerOffset

      posArr[i * 6 + 0] = cx + nx * halfW
      posArr[i * 6 + 1] = gy
      posArr[i * 6 + 2] = cz + nz * halfW
      posArr[i * 6 + 3] = cx - nx * halfW
      posArr[i * 6 + 4] = gy
      posArr[i * 6 + 5] = cz - nz * halfW
    }

    for (let i = 0; i < segCount; i++) {
      const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3
      idxArr[i * 6 + 0] = a
      idxArr[i * 6 + 1] = c
      idxArr[i * 6 + 2] = b
      idxArr[i * 6 + 3] = b
      idxArr[i * 6 + 4] = c
      idxArr[i * 6 + 5] = d
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new Float32BufferAttribute(posArr, 3))
    geo.setIndex(Array.from(idxArr))
    geo.computeVertexNormals()
    const ribbon = new Mesh(geo, material)
    ribbon.receiveShadow = true
    scene.add(ribbon)
    return ribbon
  }

  // ── Highway-v2: detecção de pontes/túneis ─────────────────────────────────
  // Compara altura suavizada da estrada vs terreno bruto carved nos sample
  // points. Runs contínuos de delta positivo → ponte; negativo → túnel.
  const BRIDGE_DELTA   = 2.5  // road > terreno + 2.5u por N samples → ponte
  const TUNNEL_DELTA   = 5.0  // terreno > road + 5.0u → túnel
  const STRUCT_MIN_RUN = 3    // mínimo de samples contínuos pra contar

  function _detectStructures(seg) {
    const bridges = [], tunnels = []
    const pts = seg.points, heights = seg.heights
    if (!pts || !heights) return { bridges, tunnels }

    let runType = null, runStart = 0
    const flush = (endIdx) => {
      if (runType && endIdx - runStart >= STRUCT_MIN_RUN) {
        (runType === 'bridge' ? bridges : tunnels).push({ startIdx: runStart, endIdx })
      }
      runType = null
    }

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]
      const t = _terrainRawCarvedAt(p.x, p.z)
      const d = heights[i] - t
      const type = d > BRIDGE_DELTA ? 'bridge' : (d < -TUNNEL_DELTA ? 'tunnel' : null)
      if (type !== runType) {
        flush(i)
        runType = type
        runStart = i
      }
    }
    flush(pts.length - 1)
    return { bridges, tunnels }
  }

  function _buildBridgeStructure(seg, run, out) {
    const pts = seg.points, heights = seg.heights
    const pillarMat = _hwMat.pillar
    const railMat   = _hwMat.rail

    // Pilares a cada ~14u ao longo do run
    const PILLAR_STEP = 14
    let acc = 0
    let nextAt = 0
    const sideOff = HIGHWAY_HALF_W - 0.8 // sob a borda externa das pistas

    for (let i = run.startIdx; i <= run.endIdx; i++) {
      if (i > run.startIdx) acc += pts[i].distanceTo(pts[i - 1])
      if (acc < nextAt) continue
      nextAt += PILLAR_STEP

      const p = pts[i]
      const tRaw = _terrainRawCarvedAt(p.x, p.z)
      const deckY = heights[i]
      const pillarH = Math.max(0.4, deckY - tRaw)
      if (pillarH < 0.4) continue

      // Tangente local pra calcular normal perpendicular
      const pp = pts[Math.max(0, i - 1)]
      const pn = pts[Math.min(pts.length - 1, i + 1)]
      const tx = pn.x - pp.x, tz = pn.z - pp.z
      const tl = Math.hypot(tx, tz) || 1
      const nx = -tz / tl, nz = tx / tl

      for (const side of [+1, -1]) {
        const cx = p.x + nx * sideOff * side
        const cz = p.z + nz * sideOff * side
        const geo = new CylinderGeometry(0.6, 0.7, pillarH, 6)
        const m = new Mesh(geo, pillarMat)
        m.position.set(cx, tRaw + pillarH / 2, cz)
        m.castShadow = true
        m.receiveShadow = true
        scene.add(m)
        if (out) out.push(m)
      }
    }

    // Guardrails: 2 ribbons finas elevadas, ao longo do run
    const subPts = pts.slice(run.startIdx, run.endIdx + 1)
    const subH   = heights.slice(run.startIdx, run.endIdx + 1)
    if (subPts.length >= 2) {
      const railSeg = { heights: subH }
      const segCount = subPts.length - 1
      const r1 = _buildOffsetRibbon(subPts, segCount,  HIGHWAY_HALF_TOTAL - 0.1, 0.25, railMat, railSeg, 0.95)
      const r2 = _buildOffsetRibbon(subPts, segCount, -HIGHWAY_HALF_TOTAL + 0.1, 0.25, railMat, railSeg, 0.95)
      if (out) { out.push(r1); out.push(r2) }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Rios: detecta picos em biomas montanhosos e traça caminho
  // via gradient descent até atingir baixadas / fronteira do mapa.
  // ─────────────────────────────────────────────────────────────
  function _generateRivers() {
    _riverPolylines = []
    _lakeCenters = []

    // Sample heightmap em grid pra encontrar picos locais. Grid escala com mundo
    // pra manter cellSize razoável independente de TERRAIN_HALF.
    const TARGET_CELL = 28
    const GRID = Math.min(256, Math.max(40, Math.round((TERRAIN_HALF * 2) / TARGET_CELL)))
    const cell = (TERRAIN_HALF * 2) / GRID
    const heights = new Float32Array(GRID * GRID)
    const biomes = new Array(GRID * GRID)

    for (let j = 0; j < GRID; j++) {
      for (let i = 0; i < GRID; i++) {
        const x = -TERRAIN_HALF + (i + 0.5) * cell
        const z = -TERRAIN_HALF + (j + 0.5) * cell
        heights[j * GRID + i] = heightAt(x, z)
        biomes[j * GRID + i] = biomeAt(x, z, WORLD_SCALE)
      }
    }

    // Threshold ajustado pra novo MOUNTAIN_PEAK_HEIGHT (mais baixo); aceita também picos
    // mais modestos pra ter quantidade visível de rios.
    const PEAK_MIN_HEIGHT = TERRAIN_AMPLITUDE * 0.9
    const peaks = []
    for (let j = 1; j < GRID - 1; j++) {
      for (let i = 1; i < GRID - 1; i++) {
        const idx = j * GRID + i
        if (biomes[idx] !== 'mountain') continue
        const h = heights[idx]
        if (h < PEAK_MIN_HEIGHT) continue
        let isMax = true
        for (let dj = -1; dj <= 1 && isMax; dj++) {
          for (let di = -1; di <= 1 && isMax; di++) {
            if (di === 0 && dj === 0) continue
            if (heights[(j + dj) * GRID + (i + di)] >= h) isMax = false
          }
        }
        if (isMax) {
          const x = -TERRAIN_HALF + (i + 0.5) * cell
          const z = -TERRAIN_HALF + (j + 0.5) * cell
          peaks.push({ x, z, h })
        }
      }
    }

    peaks.sort((a, b) => b.h - a.h)
    const MAX_RIVERS = 50
    const selected = peaks.slice(0, MAX_RIVERS)

    const EPS = cell * 0.5
    const STEP = cell * 0.6
    const MAX_STEPS = 280
    const STOP_HEIGHT = 0.3

    for (const peak of selected) {
      const pts = []
      let x = peak.x, z = peak.z
      let prevDir = null
      let stuckCounter = 0
      let endedInBasin = false  // virou lago?

      for (let s = 0; s < MAX_STEPS; s++) {
        pts.push(new Vector3(x, 0, z))
        const h = heightAt(x, z)
        if (h < STOP_HEIGHT) { endedInBasin = true; break }
        if (Math.abs(x) > TERRAIN_HALF - 2 || Math.abs(z) > TERRAIN_HALF - 2) break

        const hxp = heightAt(x + EPS, z)
        const hxm = heightAt(x - EPS, z)
        const hzp = heightAt(x, z + EPS)
        const hzm = heightAt(x, z - EPS)
        let gx = (hxp - hxm) / (2 * EPS)
        let gz = (hzp - hzm) / (2 * EPS)
        let gl = Math.hypot(gx, gz)
        if (gl < 1e-4) {
          stuckCounter++
          if (stuckCounter > 3) { endedInBasin = true; break }
          gx = (Math.random() - 0.5)
          gz = (Math.random() - 0.5)
          gl = Math.hypot(gx, gz) || 1
        } else {
          stuckCounter = 0
        }

        let dx = -gx / gl, dz = -gz / gl
        if (prevDir) {
          dx = dx * 0.7 + prevDir.x * 0.3
          dz = dz * 0.7 + prevDir.z * 0.3
          const dl = Math.hypot(dx, dz) || 1
          dx /= dl; dz /= dl
        }
        prevDir = { x: dx, z: dz }

        x += dx * STEP
        z += dz * STEP
      }

      if (pts.length < 6) continue

      // Suaviza polyline com média móvel
      const smoothed = []
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)]
        const b = pts[i]
        const c = pts[Math.min(pts.length - 1, i + 1)]
        smoothed.push(new Vector3((a.x + b.x + c.x) / 3, 0, (a.z + b.z + c.z) / 3))
      }

      // Calcula comprimento acumulado e largura por vértice (estreito → largo)
      const widths = new Float32Array(smoothed.length)
      let cumLen = 0
      const cumArr = new Float32Array(smoothed.length)
      for (let i = 1; i < smoothed.length; i++) {
        cumLen += smoothed[i].distanceTo(smoothed[i - 1])
        cumArr[i] = cumLen
      }
      const totalLen = Math.max(cumLen, 1)
      for (let i = 0; i < smoothed.length; i++) {
        const t = cumArr[i] / totalLen
        // Curva sqrt: rio cresce rápido no início e estabiliza (mais natural que linear)
        const w = RIVER_WIDTH_MIN + (RIVER_WIDTH_MAX - RIVER_WIDTH_MIN) * Math.sqrt(t)
        widths[i] = w * 0.5  // half-width
      }

      _riverPolylines.push({ points: smoothed, widths })

      // Lago terminal: tamanho proporcional ao comprimento do rio
      if (endedInBasin) {
        const last = smoothed[smoothed.length - 1]
        const tNorm = Math.min(1, totalLen / 200)
        const radius = LAKE_RADIUS_MIN + (LAKE_RADIUS_MAX - LAKE_RADIUS_MIN) * tNorm
        _lakeCenters.push({ x: last.x, z: last.z, radius })
      }
    }
  }

  function _generateRiverRibbons() {
    const waterMat = new MeshLambertMaterial({ color: 0x3a78c8, transparent: true, opacity: 0.85 })

    // Rios (ribbons com largura variável)
    for (const river of _riverPolylines) {
      const pts = river.points
      const widths = river.widths
      const segCount = pts.length - 1
      if (segCount < 1) continue

      const posArr = new Float32Array((segCount + 1) * 2 * 3)
      const idxArr = new Uint16Array(segCount * 6)

      for (let i = 0; i <= segCount; i++) {
        const p = pts[i]
        const pn = pts[Math.min(i + 1, segCount)]
        const pp = pts[Math.max(i - 1, 0)]
        const tx = pn.x - pp.x, tz = pn.z - pp.z
        const tl = Math.hypot(tx, tz) || 1
        const nx = -tz / tl, nz = tx / tl
        const halfW = widths[i]
        const gy = heightAt(p.x, p.z) + 0.18

        posArr[i * 6 + 0] = p.x + nx * halfW
        posArr[i * 6 + 1] = gy
        posArr[i * 6 + 2] = p.z + nz * halfW
        posArr[i * 6 + 3] = p.x - nx * halfW
        posArr[i * 6 + 4] = gy
        posArr[i * 6 + 5] = p.z - nz * halfW
      }

      for (let i = 0; i < segCount; i++) {
        const a = i * 2, b = i * 2 + 1, c = i * 2 + 2, d = i * 2 + 3
        idxArr[i * 6 + 0] = a; idxArr[i * 6 + 1] = c; idxArr[i * 6 + 2] = b
        idxArr[i * 6 + 3] = b; idxArr[i * 6 + 4] = c; idxArr[i * 6 + 5] = d
      }

      const geo = new BufferGeometry()
      geo.setAttribute('position', new Float32BufferAttribute(posArr, 3))
      geo.setIndex(Array.from(idxArr))
      geo.computeVertexNormals()

      const ribbon = new Mesh(geo, waterMat)
      ribbon.receiveShadow = true
      scene.add(ribbon)
    }

    // Lagos terminais (disco achatado)
    for (const lake of _lakeCenters) {
      const SEGS = 28
      const posArr = new Float32Array((SEGS + 1) * 3)
      const idxArr = []
      // Centro
      const cy = heightAt(lake.x, lake.z) + 0.15
      posArr[0] = lake.x; posArr[1] = cy; posArr[2] = lake.z
      for (let i = 0; i < SEGS; i++) {
        const a = (i / SEGS) * Math.PI * 2
        const px = lake.x + Math.cos(a) * lake.radius
        const pz = lake.z + Math.sin(a) * lake.radius
        posArr[(i + 1) * 3 + 0] = px
        posArr[(i + 1) * 3 + 1] = heightAt(px, pz) + 0.15
        posArr[(i + 1) * 3 + 2] = pz
      }
      for (let i = 0; i < SEGS; i++) {
        const next = i === SEGS - 1 ? 1 : i + 2
        idxArr.push(0, i + 1, next)
      }
      const geo = new BufferGeometry()
      geo.setAttribute('position', new Float32BufferAttribute(posArr, 3))
      geo.setIndex(idxArr)
      geo.computeVertexNormals()
      const lakeMesh = new Mesh(geo, waterMat)
      lakeMesh.receiveShadow = true
      scene.add(lakeMesh)
    }
  }

  // ── Vegetation com Occlusion Culling por chunks espaciais ────────────────────
  // Estratégia: em vez de um único InstancedMesh global com 14k árvores (all rendered),
  // agrupa as árvores em células de VEG_CHUNK_SIZE × VEG_CHUNK_SIZE. Cada célula tem
  // seu próprio InstancedMesh pequeno. No game loop, chunks fora de VEG_DRAW_DIST são
  // marcados visible=false — a GPU pula inteiramente o draw call deles.
  // Three.js frustum culling automático elimina adicionalmente chunks fora da câmera.
  // Resultado: ~6-10% das árvores renderizadas num dado frame vs 100% antes.
  function _generateVegetation(cities) {
    const rng     = seededRng(0xabc123)
    const placed  = []
    let   attempts = 0

    // Densidade relativa por bioma
    const TREE_DENSITY = {
      plains:   0.55,
      forest:   1.00,
      desert:   0.06,
      mountain: 0.30,
      tundra:   0.15,
      savanna:  0.25,
    }

    while (placed.length < MAX_TREES && attempts < MAX_TREES * 8) {
      attempts++
      const x = (rng() * 2 - 1) * TERRAIN_HALF * 0.9
      const z = (rng() * 2 - 1) * TERRAIN_HALF * 0.9
      if (_nearRoad(x, z) || _nearCity(x, z, cities)) continue
      if (_riverPolylines.length && _distToRivers(x, z) < RIVER_CARVE_OUTER + 1) continue

      const biome = biomeAt(x, z, WORLD_SCALE)
      if (rng() > (TREE_DENSITY[biome] ?? 0.5)) continue

      const sizeClass = rng()
      let s
      if (sizeClass < 0.3)       s = 0.8  + rng() * 0.4   // pequenas
      else if (sizeClass < 0.65) s = 1.3  + rng() * 0.6   // médias
      else                       s = 2.0  + rng() * 0.9   // grandes
      placed.push({ x, z, s, tVar: rng(), cVar: rng() })
    }

    // Geometrias compartilhadas entre todos os chunks (não duplicadas)
    const trunkMat = new MeshLambertMaterial({ color: 0x3e2a18 })
    const coneMat  = new MeshLambertMaterial({ color: 0x1e5c18 })
    const trunkGeos = [
      new CylinderGeometry(0.12, 0.22, 1.3, 6),
      new CylinderGeometry(0.15, 0.28, 1.5, 6),
      new CylinderGeometry(0.10, 0.18, 1.2, 5),
    ]
    const coneGeos = [
      new ConeGeometry(1.0,  2.6, 7),
      new ConeGeometry(1.15, 3.0, 8),
      new ConeGeometry(0.90, 2.3, 6),
    ]
    const trunkOffsets = [0.65, 0.75, 0.60]
    const coneOffsets  = [2.0,  2.25, 1.85]

    // Distribuir por chunk espacial
    const byChunk = new Map()
    for (const tree of placed) {
      const ck = `${Math.floor(tree.x / VEG_CHUNK_SIZE)},${Math.floor(tree.z / VEG_CHUNK_SIZE)}`
      if (!byChunk.has(ck)) byChunk.set(ck, [])
      byChunk.get(ck).push(tree)
    }

    const mm = new Matrix4()

    for (const [ck, trees] of byChunk) {
      const [cxi, czi] = ck.split(',').map(Number)
      const cx = cxi * VEG_CHUNK_SIZE + VEG_CHUNK_SIZE / 2
      const cz = czi * VEG_CHUNK_SIZE + VEG_CHUNK_SIZE / 2
      const n  = trees.length

      // Dois instanced meshes por chunk: um tronco + uma copa (variação determinada por tVar/cVar)
      const trunkInst = new InstancedMesh(trunkGeos[0], trunkMat, n)
      const coneInst  = new InstancedMesh(coneGeos[0],  coneMat,  n)
      trunkInst.castShadow = true
      coneInst.castShadow  = true
      // frustumCulled=true (default) deixa Three.js descartar o chunk fora do frustum
      trunkInst.frustumCulled = true
      coneInst.frustumCulled  = true

      trees.forEach(({ x, z, s, tVar, cVar }, i) => {
        const gy  = heightAt(x, z)
        const tg  = Math.floor(tVar * trunkGeos.length)
        const cg  = Math.floor(cVar * coneGeos.length)
        mm.makeScale(s, s, s)
        mm.setPosition(x, gy + trunkOffsets[tg] * s, z)
        trunkInst.setMatrixAt(i, mm)
        mm.makeScale(s, s, s)
        mm.setPosition(x, gy + coneOffsets[cg] * s, z)
        coneInst.setMatrixAt(i, mm)
      })
      trunkInst.instanceMatrix.needsUpdate = true
      coneInst.instanceMatrix.needsUpdate  = true

      scene.add(trunkInst, coneInst)

      // Registro para culling por distância no game loop
      _vegChunks.push({ meshes: [trunkInst, coneInst], cx, cz })
    }
  }

  /** Atualiza visibilidade dos chunks de vegetação baseado na distância da câmera.
   *  Chamado no game loop — O(num_chunks), cada operação O(1). */
  function _updateVegCulling(playerX, playerZ) {
    const distSq = VEG_DRAW_DIST * VEG_DRAW_DIST
    for (const chunk of _vegChunks) {
      const dx = chunk.cx - playerX
      const dz = chunk.cz - playerZ
      const visible = (dx * dx + dz * dz) < distSq
      for (const m of chunk.meshes) m.visible = visible
    }
  }



  function _generateCityPlots(cities) {
    // Grid 5×5 — cada tile ocupa 1/5 do espaço utilizável entre estradas
    const USABLE    = WORLD_SCALE - 2 * HALF_ROAD_TOTAL  // ~67.3 unidades
    const TILE_SIZE = USABLE / 5                           // ~13.46 unidades
    const CELL_W    = TILE_SIZE / 10                       // ~1.346 unidades por célula de grid

    const CATEGORY_COLORS = {
      residential: 0x8b9dc3,
      commercial:  0x6c5ce7,
      nature:      0x4caf50,
      road:        0x555566,
      decoration:  0xff6b9d,
    }
    const CATEGORY_HEIGHT = {
      residential: 1.8,
      commercial:  3.0,
      nature:      1.2,
      road:        0.25,
      decoration:  0.9,
    }

    const gltfLoader = new GLTFLoader()
    const texLoader  = new TextureLoader()

    cities.forEach(city => {
      const buildings = city.buildings ?? []
      // Offset lateral aplicado à cidade pra ficar adjacente à highway
      const off = _cityOffsets.get(city.id ?? city.userId) || { dx: 0, dz: 0 }

      // Renderiza cada prédio: GLB real se disponível, box colorido como fallback
      buildings.forEach(b => {
        const wx = city.worldX * WORLD_SCALE + HALF_ROAD_TOTAL + b.gridX * CELL_W + Math.max(b.sizeX, 1) * CELL_W / 2 + off.dx
        const wz = city.worldZ * WORLD_SCALE + HALF_ROAD_TOTAL + b.gridZ * CELL_W + Math.max(b.sizeZ, 1) * CELL_W / 2 + off.dz
        const rotY = (b.rotation ?? 0) * Math.PI / 180

        if (b.modelUrl) {
          gltfLoader.load(b.modelUrl, (gltf) => {
            const root = gltf.scene
            root.scale.setScalar(b.scaleFactor ?? 1)
            const mtl = b.material
            root.traverse((node) => {
              if (!node.isMesh) return
              const mat = new MeshStandardMaterial({
                roughness: mtl?.roughness ?? 0.7,
                metalness: mtl?.metalness ?? 0.0,
              })
              if (mtl?.textureAlbedo) {
                const isLinear = mtl.albedoColorSpace === 'linear'
                const albedo   = texLoader.load(mtl.textureAlbedo)
                albedo.flipY   = mtl.flipY ?? false
                if (!isLinear) albedo.colorSpace = SRGBColorSpace
                mat.map = albedo
              }
              if (mtl?.textureNormal) {
                const n = texLoader.load(mtl.textureNormal)
                n.flipY = mtl.flipY ?? false
                mat.normalMap = n
              }
              if (mtl?.textureRoughnessMetalness) {
                const rm = texLoader.load(mtl.textureRoughnessMetalness)
                rm.flipY = mtl.flipY ?? false
                mat.roughnessMap = rm
                mat.metalnessMap = rm
              }
              if (mtl?.textureAo) {
                const ao = texLoader.load(mtl.textureAo)
                ao.flipY = mtl.flipY ?? false
                mat.aoMap = ao
              }
              if (mtl?.textureEmissive) {
                const em = texLoader.load(mtl.textureEmissive)
                em.colorSpace = SRGBColorSpace
                em.flipY = mtl.flipY ?? false
                mat.emissiveMap = em
                mat.emissive.set(0xffffff)
              }
              node.material = mat
              node.castShadow = node.receiveShadow = true
            })
            root.position.set(wx, 0, wz)
            root.rotation.y = rotY
            scene.add(root)
          }, undefined, () => {
            // Fallback box on load error
            _addFallbackBox(b, wx, wz, rotY, CELL_W, CATEGORY_COLORS, CATEGORY_HEIGHT)
          })
        } else {
          _addFallbackBox(b, wx, wz, rotY, CELL_W, CATEGORY_COLORS, CATEGORY_HEIGHT)
        }
      })
    })
  }

  function _addFallbackBox(b, wx, wz, rotY, CELL_W, CATEGORY_COLORS, CATEGORY_HEIGHT) {
    const color = CATEGORY_COLORS[b.category] ?? 0xaaaaaa
    const bh    = CATEGORY_HEIGHT[b.category] ?? 1.5
    const bw    = Math.max(b.sizeX, 1) * CELL_W * 0.82
    const bd    = Math.max(b.sizeZ, 1) * CELL_W * 0.82
    const geo   = new BoxGeometry(bw, bh, bd)
    const mat   = new MeshLambertMaterial({ color })
    const mesh  = new Mesh(geo, mat)
    mesh.castShadow = mesh.receiveShadow = true
    mesh.position.set(wx, bh / 2, wz)
    mesh.rotation.y = rotY
    scene.add(mesh)
  }

  // ── Player vehicle ─────────────────────────────────────────────────────────────
  function _buildBoxVehicle(color = 0x6c5ce7) {
    const geo  = new BoxGeometry(1.4, 0.68, 2.8)
    const mesh = new Mesh(geo, new MeshLambertMaterial({ color }))
    mesh.castShadow = true
    const hMat = new MeshLambertMaterial({ color: 0xfff4e0, emissive: 0xfff4e0, emissiveIntensity: 0.8 })
    ;[-0.44, 0.44].forEach(ox => {
      const h = new Mesh(new BoxGeometry(0.28, 0.14, 0.1), hMat)
      h.position.set(ox, 0.1, -1.45)
      mesh.add(h)
    })
    return mesh
  }

  const API_BASE = import.meta.env.VITE_API_URL || ''

  function _resolveUrl(url) {
    if (!url) return null
    return url.startsWith('http') ? url : `${API_BASE}${url}`
  }

  function _applyGlbMaterial(root, matData) {
    if (!matData) return
    const texLoader = new TextureLoader()
    root.traverse(node => {
      if (!node.isMesh) return
      const m = new MeshStandardMaterial({
        roughness: matData.roughness ?? 0.7,
        metalness: matData.metalness ?? 0.0,
      })
      if (matData.textureAlbedo) {
        const t = texLoader.load(_resolveUrl(matData.textureAlbedo))
        t.flipY = matData.flipY ?? false
        if (matData.albedoColorSpace !== 'linear') t.colorSpace = SRGBColorSpace
        m.map = t
      }
      if (matData.textureNormal) {
        const t = texLoader.load(_resolveUrl(matData.textureNormal)); t.flipY = matData.flipY ?? false; m.normalMap = t
      }
      if (matData.textureRoughnessMetalness) {
        const t = texLoader.load(_resolveUrl(matData.textureRoughnessMetalness)); t.flipY = matData.flipY ?? false
        m.roughnessMap = m.metalnessMap = t
      }
      node.material = m
      node.material.needsUpdate = true
    })
  }

  function _spawnVehicle(activeVehicle = null) {
    if (activeVehicle?.catalog?.modelUrl) {
      const loader = new GLTFLoader()
      const url = activeVehicle.catalog.modelUrl.startsWith('http')
        ? activeVehicle.catalog.modelUrl
        : `${import.meta.env.VITE_API_URL || ''}${activeVehicle.catalog.modelUrl}`

      loader.load(url, (gltf) => {
        const root  = gltf.scene
        const scale = activeVehicle.catalog.vehicleAsset?.scaleFactor ?? 1
        root.scale.setScalar(scale)
        root.castShadow = true
        _applyGlbMaterial(root, activeVehicle.catalog.vehicleAsset?.material)
        root.position.copy(vehicle.pos)

        // Coletar rodas para animação
        vehicle.wheelMeshes = []
        root.traverse(node => {
          if (node.isMesh && node.name.toLowerCase().includes('wheel')) {
            vehicle.wheelMeshes.push(node)
          }
        })

        scene.add(root)
        vehicle.mesh = root
        vehicle.groundY = 0  // GLB tem origem no chão
      }, undefined, () => {
        // Fallback: GLB falhou, usar box
        vehicle.mesh = _buildBoxVehicle(0x6c5ce7)
        vehicle.groundY = 0.42
        vehicle.mesh.position.copy(vehicle.pos)
        scene.add(vehicle.mesh)
      })
    } else {
      vehicle.mesh = _buildBoxVehicle(0x6c5ce7)
      vehicle.groundY = 0.42
      vehicle.mesh.position.copy(vehicle.pos)
      scene.add(vehicle.mesh)
    }
  }

  // ── Ambient cars ───────────────────────────────────────────────────────────────
  let _vehicleCatalogGlobal = []
  // Cache: url → { state: 'pending'|'ready'|'failed', scene: Group, scaleFactor, material }
  const _glbCache = new Map()
  // Pending spawns: { info, params } esperando o GLB carregar
  const _pendingCarSpawns = []
  const _glbLoader = new GLTFLoader()

  function _resolveModelUrl(modelUrl) {
    return modelUrl.startsWith('http') ? modelUrl : `${import.meta.env.VITE_API_URL || ''}${modelUrl}`
  }

  function _preloadCatalogGlbs(catalog) {
    const active = catalog.filter(v => v.isActive && v.modelUrl)
    for (const item of active) {
      const url = _resolveModelUrl(item.modelUrl)
      if (_glbCache.has(url)) continue
      const entry = {
        state: 'pending',
        scene: null,
        scaleFactor: item.vehicleAsset?.scaleFactor ?? 1,
        material: item.vehicleAsset?.material ?? null,
      }
      _glbCache.set(url, entry)
      _glbLoader.load(url, (gltf) => {
        entry.scene = gltf.scene
        entry.state = 'ready'
        // Aplica material no template para que clones já tenham a aparência correta
        _applyGlbMaterial(entry.scene, entry.material)
        _flushPendingSpawnsFor(url)
      }, undefined, () => {
        entry.state = 'failed'
        // Mesmo em falha, libera pendings com fallback box (evitar travar)
        _flushPendingSpawnsFor(url)
      })
    }
  }

  function _flushPendingSpawnsFor(url) {
    for (let i = _pendingCarSpawns.length - 1; i >= 0; i--) {
      const sp = _pendingCarSpawns[i]
      if (sp.url !== url) continue
      _pendingCarSpawns.splice(i, 1)
      if (!_highwayChunks.has(sp.info.chunkIdx)) continue // chunk já foi descartado
      _instantiateCarFromCache(sp)
    }
  }

  function _cloneGlb(root) {
    // Clona estrutura recursivamente; mesh compartilha geometry, mas material é único.
    return root.clone(true)
  }

  function _instantiateCarFromCache(sp) {
    const { info, px, pz, yAngle, t, dir, speed, lane, color, url } = sp
    const entry = _glbCache.get(url)
    const seg = info.segment

    if (entry?.state === 'ready' && entry.scene) {
      const root = _cloneGlb(entry.scene)
      root.scale.setScalar(entry.scaleFactor)
      root.castShadow = true
      root.rotation.y = yAngle
      const py = heightAt(px, pz)
      root.position.set(px, py, pz)

      const wheelMeshes = []
      root.traverse(node => {
        if (node.isMesh && node.name.toLowerCase().includes('wheel')) wheelMeshes.push(node)
      })

      root.userData = { seg, t, dir, speed, lane, wheelMeshes, groundY: 0 }
      scene.add(root)
      ambientCars.push(root)
      info.cars.push(root)
    } else {
      // Fallback box (catálogo vazio ou load falhou definitivamente)
      const mat  = new MeshLambertMaterial({ color })
      const mesh = new Mesh(new BoxGeometry(1.5, 0.65, 2.8), mat)
      mesh.castShadow = true
      mesh.rotation.y = yAngle
      const py = heightAt(px, pz)
      mesh.position.set(px, py + 0.42, pz)
      mesh.userData = { seg, t, dir, speed, lane, groundY: 0.42 }
      scene.add(mesh)
      ambientCars.push(mesh)
      info.cars.push(mesh)
    }
  }

  function _spawnAmbientCars(vehicleCatalog = []) {
    _vehicleCatalogGlobal = vehicleCatalog
    _preloadCatalogGlbs(vehicleCatalog)
    for (const info of _highwayChunks.values()) {
      if (info.cars.length === 0) _spawnAmbientCarsForSegment(info)
    }
  }

  function _spawnAmbientCarsForSegment(info) {
    if (!info?.segment) return
    if (info.cars.length > 0) return
    const seg = info.segment
    const vehicleCatalog = _vehicleCatalogGlobal || []
    const palette = [0x8b9dc3, 0x4a9eff, 0x00d9c0, 0xff6b9d, 0xffd166, 0xc8bfe8]
    const rng = seededRng(0xf00dcafe ^ ((info.chunkIdx | 0) * 2654435761))

    _preloadCatalogGlbs(vehicleCatalog) // garante preload (idempotente)
    const activeGlb = vehicleCatalog.filter(v => v.isActive && v.modelUrl)
    const si = info.chunkIdx | 0
    const carsHere = 2
    const LANE_CENTER = (HIGHWAY_MEDIAN_W * 0.5) + (HIGHWAY_LANE_W * 0.5)

    for (let i = 0; i < carsHere; i++) {
      const t     = rng()
      const lane  = i % 2 === 0 ? LANE_CENTER : -LANE_CENTER
      const dir   = i % 2 === 0 ? 1 : -1
      const speed = 8 + rng() * 7

      const p   = seg.curve.getPointAt(t)
      const tan = seg.curve.getTangentAt(t)
      const nx  = -tan.z, nz = tan.x
      const px  = p.x + nx * lane
      const pz  = p.z + nz * lane
      const yAngle = Math.atan2(tan.x * dir, tan.z * dir)
      const color = palette[(si * 2 + i) % palette.length]

      const catalogItem = activeGlb.length ? activeGlb[(si * 2 + i) % activeGlb.length] : null
      const url = catalogItem ? _resolveModelUrl(catalogItem.modelUrl) : null
      const entry = url ? _glbCache.get(url) : null

      const sp = { info, px, pz, yAngle, t, dir, speed, lane, color, url }

      if (entry?.state === 'ready') {
        _instantiateCarFromCache(sp)
      } else if (entry?.state === 'pending') {
        _pendingCarSpawns.push(sp)
      } else if (entry?.state === 'failed' && activeGlb.length > 1) {
        // Falhou esse modelo; tenta achar um modelo ready/pending no catálogo
        let picked = null
        for (let k = 0; k < activeGlb.length; k++) {
          const alt = activeGlb[(si * 2 + i + k + 1) % activeGlb.length]
          const altUrl = _resolveModelUrl(alt.modelUrl)
          const altEntry = _glbCache.get(altUrl)
          if (altEntry?.state === 'ready' || altEntry?.state === 'pending') {
            picked = { entry: altEntry, url: altUrl }
            break
          }
        }
        if (picked) {
          sp.url = picked.url
          if (picked.entry.state === 'ready') _instantiateCarFromCache(sp)
          else _pendingCarSpawns.push(sp)
        } else {
          _instantiateCarFromCache(sp) // todos falharam → box
        }
      } else {
        // Sem catálogo (entry null) → box (cenário legítimo)
        _instantiateCarFromCache(sp)
      }
    }
  }

  // ── NPC ────────────────────────────────────────────────────────────────────────
  function _spawnNpc() {
    npc.group = new Group()
    const body = new Mesh(new BoxGeometry(0.5, 1.1, 0.35), new MeshLambertMaterial({ color: 0x8e7df0 }))
    body.position.set(0, 0.55, 0)
    body.castShadow = true
    const head = new Mesh(new BoxGeometry(0.4, 0.4, 0.4), new MeshLambertMaterial({ color: 0xf0d4b0 }))
    head.position.set(0, 1.55, 0)
    head.castShadow = true
    npc.group.add(body, head)
    npc.group.position.copy(npc.pos)
    scene.add(npc.group)
  }

  // ── Enter / Exit ───────────────────────────────────────────────────────────────
  function _enterVehicle() {
    mode = 'driving'
    playerMode.value = 'driving'
    if (npc.group) npc.group.visible = false
    freeCamDrag.active = false // Stop mouse look when entering vehicle
  }

  function _exitVehicle() {
    mode = 'walking'
    playerMode.value = 'walking'
    const right = new Vector3(Math.cos(vehicle.angle), 0, -Math.sin(vehicle.angle))
    npc.pos.copy(vehicle.pos).addScaledVector(right, 2.2)
    npc.pos.y = heightAt(npc.pos.x, npc.pos.z)
    npc.angle = vehicle.angle
    if (npc.group) {
      npc.group.position.copy(npc.pos)
      npc.group.rotation.y = npc.angle
      npc.group.visible = cameraMode !== 2
    }
    // Reset free camera to default position
    freeCamYaw = 0
    freeCamPitch = -0.3
    freeCamDrag.active = false
  }

  // ── Game loop ──────────────────────────────────────────────────────────────────
  function _startLoop() {
    function tick(now = 0) {
      animId = requestAnimationFrame(tick)
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now
      _updateDayNight(dt)
      _updateClouds(dt)
      if (mode === 'walking') _updateNpc(dt)
      else                    _updateVehicle(dt)
      _updateAmbientCars(dt)
      _updateCamera(dt)
      // Stream chunks de terreno ao redor do veículo/NPC ativo
      const player = mode === 'walking' ? npc.pos : vehicle.pos
      _updateHighwayStreaming(player.x)
      _updateChunkStreaming(player.x, player.z)
      // Occlusion culling de vegetação: esconde chunks de árvores fora de VEG_DRAW_DIST
      if (_vegChunks.length) _updateVegCulling(player.x, player.z)
      renderer.render(scene, camera)
    }
    tick()
  }

  function _updateNpc(dt) {
    const fwd   = keysDown.has('ArrowUp')    || keysDown.has('KeyW')
    const back  = keysDown.has('ArrowDown')  || keysDown.has('KeyS')
    const left  = keysDown.has('ArrowLeft')  || keysDown.has('KeyA')
    const right = keysDown.has('ArrowRight') || keysDown.has('KeyD')
    if (fwd)  npc.speed = Math.min(npc.speed + npc.accel * dt, npc.maxSpeed)
    if (back) npc.speed = Math.max(npc.speed - npc.accel * dt, -npc.maxSpeed * 0.4)
    if (!fwd && !back) npc.speed *= Math.max(0, 1 - npc.friction * dt)
    
    // In first person (cameraMode 2), keyboard can also rotate
    if (cameraMode === 2) {
      if (Math.abs(npc.speed) > 0.1) {
        freeCamYaw += ((left ? 1 : 0) - (right ? 1 : 0)) * npc.turnSpeed * dt * Math.sign(npc.speed)
      }
      npc.angle = freeCamYaw
    } else {
      // In third person, use keyboard for rotation (only when moving)
      if (Math.abs(npc.speed) > 0.1) {
        npc.angle += ((left ? 1 : 0) - (right ? 1 : 0)) * npc.turnSpeed * dt * Math.sign(npc.speed)
      }
    }
    
    npc.pos.x += Math.sin(npc.angle) * npc.speed * dt
    npc.pos.z += Math.cos(npc.angle) * npc.speed * dt
    npc.pos.y  = heightAt(npc.pos.x, npc.pos.z)
    if (npc.group) { npc.group.position.copy(npc.pos); npc.group.rotation.y = npc.angle }
    playerPos.value = { x: Math.round(npc.pos.x), z: Math.round(npc.pos.z) }
  }

  function _updateVehicle(dt) {
    const fwd   = keysDown.has('ArrowUp')    || keysDown.has('KeyW')
    const back  = keysDown.has('ArrowDown')  || keysDown.has('KeyS')
    const left  = keysDown.has('ArrowLeft')  || keysDown.has('KeyA')
    const right = keysDown.has('ArrowRight') || keysDown.has('KeyD')
    if (fwd)  vehicle.speed = Math.min(vehicle.speed + vehicle.accel * dt, vehicle.maxSpeed)
    if (back) vehicle.speed = Math.max(vehicle.speed - vehicle.accel * dt, -vehicle.maxSpeed * 0.45)
    if (!fwd && !back) vehicle.speed *= Math.max(0, 1 - vehicle.friction * dt)
    if (Math.abs(vehicle.speed) > 0.15) {
      vehicle.angle += ((left ? 1 : 0) - (right ? 1 : 0)) * vehicle.turnSpeed * dt * Math.sign(vehicle.speed)
    }
    vehicle.pos.x += Math.sin(vehicle.angle) * vehicle.speed * dt
    vehicle.pos.z += Math.cos(vehicle.angle) * vehicle.speed * dt
    vehicle.pos.y  = heightAt(vehicle.pos.x, vehicle.pos.z) + vehicle.groundY
    if (vehicle.mesh) { vehicle.mesh.position.copy(vehicle.pos); vehicle.mesh.rotation.y = vehicle.angle }

    // Girar rodas proporcionalmente à velocidade
    if (vehicle.wheelMeshes.length) {
      const rot = (vehicle.speed * dt) / WHEEL_RADIUS
      vehicle.wheelMeshes.forEach(w => { w.rotation.x -= rot })
    }

    playerPos.value = { x: Math.round(vehicle.pos.x), z: Math.round(vehicle.pos.z) }
  }

  function _updateAmbientCars(dt) {
    ambientCars.forEach(car => {
      const ud = car.userData
      let seg = ud.seg
      ud.t += (ud.speed * dt / seg.length) * ud.dir

      // Travessia de fronteira de chunk: transfere o carro para o chunk vizinho
      // pra que a rodovia se comporte como uma \u00fanica via cont\u00ednua.
      let safety = 4
      while (ud.t > 1 && safety-- > 0) {
        const nextIdx = (seg.chunkIdx | 0) + 1
        const nextInfo = _highwayChunks.get(nextIdx)
        if (!nextInfo) { ud.t = 1; break }
        ud.t -= 1
        const oldInfo = _highwayChunks.get(seg.chunkIdx)
        if (oldInfo) {
          const i = oldInfo.cars.indexOf(car)
          if (i >= 0) oldInfo.cars.splice(i, 1)
        }
        nextInfo.cars.push(car)
        seg = nextInfo.segment
        ud.seg = seg
      }
      safety = 4
      while (ud.t < 0 && safety-- > 0) {
        const prevIdx = (seg.chunkIdx | 0) - 1
        const prevInfo = _highwayChunks.get(prevIdx)
        if (!prevInfo) { ud.t = 0; break }
        ud.t += 1
        const oldInfo = _highwayChunks.get(seg.chunkIdx)
        if (oldInfo) {
          const i = oldInfo.cars.indexOf(car)
          if (i >= 0) oldInfo.cars.splice(i, 1)
        }
        prevInfo.cars.push(car)
        seg = prevInfo.segment
        ud.seg = seg
      }

      const { lane, dir, speed, wheelMeshes, groundY = 0 } = ud
      const t   = ud.t
      const p   = seg.curve.getPointAt(t)
      const tan = seg.curve.getTangentAt(t)
      const nx  = -tan.z, nz = tan.x
      const px  = p.x + nx * lane
      const pz  = p.z + nz * lane
      const py  = heightAt(px, pz) + groundY
      car.position.set(px, py, pz)
      car.rotation.y = Math.atan2(tan.x * dir, tan.z * dir)

      // Girar rodas dos carros ambiente
      if (wheelMeshes?.length) {
        const rot = (speed * dir * dt) / WHEEL_RADIUS
        wheelMeshes.forEach(w => { w.rotation.x -= rot })
      }
    })
  }

  // ── Camera ─────────────────────────────────────────────────────────────────────
  function _updateCamera(dt) {
    const target = mode === 'driving' ? vehicle.pos : npc.pos
    const angle  = mode === 'driving' ? vehicle.angle : npc.angle
    const lerpK  = Math.min(1, 8 * dt)

    if (cameraMode === 0) {
      camera = orthoCamera
      const off = camFrustum * 1.15
      camPos.x  += (target.x + off - camPos.x) * lerpK
      camPos.z  += (target.z + off - camPos.z) * lerpK
      camPos.y   = camFrustum * 1.05
      camLookAt.x += (target.x - camLookAt.x) * lerpK
      camLookAt.z += (target.z - camLookAt.z) * lerpK
      camLookAt.y  = 0
    } else if (cameraMode === 1) {
      camera = perspCamera

      if (mode === 'walking') {
        // 3ª pessoa walking: órbita pura ao redor do alvo
        const cosP = Math.cos(freeCamPitch)
        const sinP = Math.sin(freeCamPitch)
        const cosY = Math.cos(freeCamYaw)
        const sinY = Math.sin(freeCamYaw)

        const offsetX = freeCamRadius * cosP * sinY
        const offsetY = freeCamHeight + freeCamRadius * sinP
        const offsetZ = freeCamRadius * cosP * cosY

        camPos.set(target.x + offsetX, target.y + offsetY, target.z + offsetZ)
        camLookAt.set(target.x, target.y + 0.5, target.z)
      } else {
        // 3ª pessoa driving: câmera atrás do carro + offset livre de yaw/pitch pelo mouse
        const baseYaw  = angle + Math.PI       // atrás do carro
        const finalYaw = baseYaw + freeCamYaw
        const pitch    = freeCamPitch - 0.25   // levemente acima por padrão
        const cosP = Math.cos(pitch)
        const sinP = Math.sin(pitch)
        const radius = 12
        const offsetX = radius * cosP * Math.sin(finalYaw)
        const offsetY = 5 + radius * sinP * -1
        const offsetZ = radius * cosP * Math.cos(finalYaw)

        const idealX = target.x + offsetX
        const idealY = target.y + offsetY
        const idealZ = target.z + offsetZ
        camPos.x += (idealX - camPos.x) * lerpK
        camPos.y += (idealY - camPos.y) * lerpK
        camPos.z += (idealZ - camPos.z) * lerpK
        camLookAt.x += (target.x     - camLookAt.x) * lerpK
        camLookAt.y += (target.y + 1 - camLookAt.y) * lerpK
        camLookAt.z += (target.z     - camLookAt.z) * lerpK
      }
    } else {
      // First person camera (cameraMode === 2)
      camera = perspCamera
      const lf = Math.min(1, 18 * dt)
      camPos.x += (target.x + Math.sin(angle) * 0.3 - camPos.x) * lf
      camPos.y += (target.y + 1.6                   - camPos.y) * lf
      camPos.z += (target.z + Math.cos(angle) * 0.3 - camPos.z) * lf
      
      // Free look with mouse or default forward look
      if (freeCamDrag.active) {
        // Mouse look enabled - look in pitch/yaw direction
        const cosP = Math.cos(freeCamPitch)
        const sinP = Math.sin(freeCamPitch)
        const cosY = Math.cos(freeCamYaw)
        const sinY = Math.sin(freeCamYaw)
        
        camLookAt.set(
          camPos.x + sinY * cosP * 10,
          camPos.y + sinP * 10,
          camPos.z + cosY * cosP * 10
        )
      } else {
        // Default look - forward relative to player angle
        camLookAt.set(camPos.x + Math.sin(angle) * 10, camPos.y, camPos.z + Math.cos(angle) * 10)
      }
    }

    camera.position.copy(camPos)
    camera.lookAt(camLookAt)

    // Keep sky centered on camera
    if (skyMesh)    skyMesh.position.copy(camPos)
    if (starPoints) starPoints.position.copy(camPos)
    if (starPointsBright) starPointsBright.position.copy(camPos)
    if (moonMesh)   moonMesh.position.set(camPos.x + 380, camPos.y + 320, camPos.z - 420)

    if (cameraMode !== 0 && canvasRef.value) {
      perspCamera.aspect = canvasRef.value.clientWidth / canvasRef.value.clientHeight
      perspCamera.updateProjectionMatrix()
    }

    if (npc.group && mode === 'walking') npc.group.visible = cameraMode !== 2
  }

  // ── Nearby city check ─────────────────────────────────────────────────────────
  function checkNearbyCities(cities) {
    nearbyCity.value    = null
    enterCityZone.value = null
    const pos = mode === 'driving' ? vehicle.pos : npc.pos
    for (const city of cities) {
      const vp   = cityVisualPos(city)
      const dist = Math.hypot(pos.x - vp.x, pos.z - vp.z)
      if (dist < PLOT_RADIUS) {
        enterCityZone.value = city
        return
      }
      if (dist < PLOT_RADIUS + 20) {
        nearbyCity.value = city
      }
    }
  }

  // ── Road / city proximity helpers ──────────────────────────────────────────────
  function _nearRoad(x, z) {
    if (!_roadPolylines.length) return false
    const margin = HALF_ROAD_TOTAL + 2
    return _distToRoads(x, z) < margin
  }

  function _nearCity(x, z, cities) {
    return cities.some(c => {
      const vp = cityVisualPos(c)
      return Math.abs(x - vp.x) < PLOT_RADIUS + 4 && Math.abs(z - vp.z) < PLOT_RADIUS + 4
    })
  }

  // ── Controls ───────────────────────────────────────────────────────────────────
  function _attachControls(canvas) {
    canvas.setAttribute('tabindex', '0')
    window.addEventListener('keydown', _onKey)
    window.addEventListener('keyup',   _onKey)
    canvas.addEventListener('wheel', _onWheel, { passive: false })
    canvas.addEventListener('mousedown', _onMouseDown, { passive: true })
    canvas.addEventListener('mousemove', _onMouseMove, { passive: true })
    canvas.addEventListener('mouseup',   _onMouseUp,   { passive: true })
    canvas.addEventListener('mouseleave', _onMouseUp,  { passive: true })
  }

  function _detachControls() {
    window.removeEventListener('keydown', _onKey)
    window.removeEventListener('keyup',   _onKey)
    canvasRef.value?.removeEventListener('wheel', _onWheel)
    canvasRef.value?.removeEventListener('mousedown', _onMouseDown)
    canvasRef.value?.removeEventListener('mousemove', _onMouseMove)
    canvasRef.value?.removeEventListener('mouseup',   _onMouseUp)
    canvasRef.value?.removeEventListener('mouseleave', _onMouseUp)
  }

  function _onKey(e) {
    const block = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']
    if (block.includes(e.key) && e.type === 'keydown') e.preventDefault()

    if (e.type === 'keydown') {
      if (e.code === 'KeyE' && !keysDown.has('KeyE')) {
        if (mode === 'driving') {
          _exitVehicle()
        } else if (npc.pos.distanceTo(vehicle.pos) < ENTER_DIST) {
          _enterVehicle()
        }
      }
      if (e.code === 'KeyC' && !keysDown.has('KeyC')) {
        cameraMode = (cameraMode + 1) % 3
        cameraModeRef.value = cameraMode
        
        // Reset free camera when entering first person (mode 2)
        if (cameraMode === 2) {
          freeCamYaw = npc.angle
          freeCamPitch = -0.1
        }
      }
      keysDown.add(e.code)
    } else {
      keysDown.delete(e.code)
    }
  }

  function _onWheel(e) {
    e.preventDefault()
    if (cameraMode !== 0) return
    const a = canvasRef.value.clientWidth / canvasRef.value.clientHeight
    camFrustum = Math.max(8, Math.min(55, camFrustum + e.deltaY * 0.018))
    orthoCamera.left = -camFrustum * a; orthoCamera.right  =  camFrustum * a
    orthoCamera.top  =  camFrustum;     orthoCamera.bottom = -camFrustum
    orthoCamera.updateProjectionMatrix()
  }

  function _onMouseDown(e) {
    // Mouse look habilitado em cameraMode 1 (3ª pessoa) e 2 (1ª pessoa), tanto andando quanto dirigindo
    if (cameraMode === 1 || cameraMode === 2) {
      freeCamDrag.active = true
      freeCamDrag.lastX = e.clientX
      freeCamDrag.lastY = e.clientY
    }
  }

  function _onMouseMove(e) {
    if (!freeCamDrag.active) return

    const deltaX = e.clientX - freeCamDrag.lastX
    const deltaY = e.clientY - freeCamDrag.lastY

    freeCamYaw   -= deltaX * freeCamSpeed
    freeCamPitch += deltaY * freeCamSpeed

    // Clamp pitch to avoid flipping
    freeCamPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, freeCamPitch))

    freeCamDrag.lastX = e.clientX
    freeCamDrag.lastY = e.clientY
  }

  function _onMouseUp() {
    freeCamDrag.active = false
  }

  // ── Resize / Dispose ───────────────────────────────────────────────────────────
  function resize() {
    const canvas = canvasRef.value
    if (!canvas || !renderer) return
    const W = canvas.clientWidth, H = canvas.clientHeight, a = W / H
    orthoCamera.left = -camFrustum * a; orthoCamera.right  =  camFrustum * a
    orthoCamera.top  =  camFrustum;     orthoCamera.bottom = -camFrustum
    orthoCamera.updateProjectionMatrix()
    perspCamera.aspect = a
    perspCamera.updateProjectionMatrix()
    renderer.setSize(W, H, false)
  }

  function dispose() {
    cancelAnimationFrame(animId)
    _disposeChunkStreaming()
    _detachControls()
    renderer?.dispose()
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    const canvas = canvasRef.value
    const W = canvas.clientWidth, H = canvas.clientHeight

    renderer = new WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(W, H, false)
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0

    scene = new Scene()
    scene.background = _bgColor
    scene.fog = new FogExp2(0x000000, 0.004)

    _buildCameras(W, H)
    _buildLights()
    _buildSky()
    _buildClouds()
    _buildStars()
    _attachControls(canvas)
    _startLoop()
    ready.value = true
  }

  return {
    ready, nearbyCity, enterCityZone, playerPos, playerMode, cameraModeRef, timeOfDay,
    init, loadWorld, checkNearbyCities, resize, dispose,
  }
}
