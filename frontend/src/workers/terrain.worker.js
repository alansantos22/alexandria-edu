// Web Worker que gera UM chunk procedural completo: heightmap, vertex colors,
// e (opcionalmente) uma estrada orgânica via A* em biomas de relevo.
//
// Mensagem de entrada (postMessage):
// {
//   chunkX, chunkZ,        // coords do chunk (inteiros)
//   chunkSize,             // tamanho do chunk em unidades de mundo (ex 80)
//   segments,              // tesselação (ex 32 high LOD, 16 low LOD)
//   amplitude,             // TERRAIN_AMPLITUDE
//   terrainFreq,           // FBM base frequency
//   worldScale,            // pra biomeAt
//   flattenInner, flattenOuter,
//   roadFlat: [inner, outer],
//   river: { carveInner, carveOuter, carveDepth },
//   roads:  [{points: Float32Array(x,z pares)}],  // polylines globais a aplicar como deformação
//   rivers: [{points: Float32Array(x,z pares)}],
//   cities,                // [{x, z}] que possam afetar este chunk
//   canyon: { freq, threshold, depth },
//   mountainPeak: { threshold, height },
//   noiseSeed,
//   organicRoadChance,
// }
//
// Saída: { chunkX, chunkZ, heights, colors, organicRoad? }
// (heights e colors transferidos via Transferable)

import { SimplexNoise } from 'three/addons/math/SimplexNoise.js'
import { assignBiome, BIOME_AMPLITUDE, BIOME_COLOR } from '../composables/biome.util.js'

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

let noise = new SimplexNoise(makeSeededRandomSource(0x5eed1234))
let _noiseSeed = 0x5eed1234

function biomeAt(x, z, worldScale) {
  const gx = Math.floor(x / worldScale)
  const gz = Math.floor(z / worldScale)
  return assignBiome(gx, gz)
}

function fbm(x, z, freq0) {
  let h = 0, amp = 1, freq = freq0, max = 0
  for (let i = 0; i < 4; i++) {
    h   += amp * noise.noise(x * freq, z * freq)
    max += amp
    amp *= 0.5
    freq *= 2
  }
  return h / max
}

// Ridged multifractal compound (octaves amplificadas pelas anteriores) — cordilheiras
// hierárquicas com sub-cristas, gerando vales/canyons mais orgânicos.
function ridgeAt(x, z, freq0) {
  const r0 = 1 - Math.abs(noise.noise(x * freq0 + 100, z * freq0 - 100))
  const e0 = r0 * r0
  const r1 = 1 - Math.abs(noise.noise(x * freq0 * 2 + 100, z * freq0 * 2 - 100))
  const e1 = r1 * r1 * e0
  const r2 = 1 - Math.abs(noise.noise(x * freq0 * 4 + 100, z * freq0 * 4 - 100))
  const e2 = r2 * r2 * (e0 + e1)
  return (e0 + 0.5 * e1 + 0.25 * e2) / 1.75
}

function ridgeAtAlt(x, z, freq0) {
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

function fbmWarped(x, z, freq0, warpAmp) {
  const q1 = noise.noise(x * freq0 * 0.5 + 13.1, z * freq0 * 0.5 - 7.7)
  const q2 = noise.noise(x * freq0 * 0.5 + 5.2,  z * freq0 * 0.5 + 1.3)
  return fbm(x + q1 * warpAmp, z + q2 * warpAmp, freq0)
}

function mesaTerrace(h, step, mix) {
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

function heightAt(x, z, cfg) {
  const biome = biomeAt(x, z, cfg.worldScale)
  const amp = cfg.amplitude * (BIOME_AMPLITUDE[biome] ?? 1)
  let h = fbm(x, z, cfg.terrainFreq) * amp

  if (biome === 'desert') {
    const r = ridgeAt(x, z, cfg.canyon.freq)
    if (r > cfg.canyon.threshold) {
      const u = Math.min(1, (r - cfg.canyon.threshold) / (cfg.canyon.cliffWindow || 0.07))
      const t = u * u * (3 - 2 * u)
      const altScale = Math.max(0.4, Math.min(1.6, (h + amp * 0.3) / 12))
      h -= cfg.canyon.depth * altScale * t
    }
  } else if (biome === 'mountain') {
    // Base recomputada com domain warping
    h = fbmWarped(x, z, cfg.terrainFreq, cfg.mountainWarpAmp) * amp

    // Canion intermonte
    const rc = ridgeAtAlt(x, z, cfg.mountainCanyon.freq)
    if (rc > cfg.mountainCanyon.threshold) {
      const tc = (rc - cfg.mountainCanyon.threshold) / (1 - cfg.mountainCanyon.threshold)
      h -= cfg.mountainCanyon.depth * tc * tc
    }

    // Picos / chapadas com topo plano
    const r = ridgeAt(x, z, cfg.canyon.freq)
    if (r > cfg.mountainPeak.threshold) {
      const t = (r - cfg.mountainPeak.threshold) / (1 - cfg.mountainPeak.threshold)
      const shape = t < 0.65 ? t / 0.65 : 1.0
      h += cfg.mountainPeak.height * shape
    }

    // Terracing em faixas médias
    if (h > 6 && h < 30) {
      h = mesaTerrace(h, cfg.mesa.step, cfg.mesa.mix)
    }
  }

  // Aplaina ao redor das estradas: lerpa terreno em direção à altura da centerline.
  // Assim as estradas sobem ladeiras suavemente (não afundam para o nível do mar).
  if (cfg.roads && cfg.roads.length) {
    const { dist: dRoad, height: roadH } = roadInfoAt(x, z, cfg.roads)
    if (dRoad < cfg.roadFlat[1]) {
      const fac = flattenFactor(dRoad, cfg.roadFlat[0], cfg.roadFlat[1])
      h = h * fac + roadH * (1 - fac)
    }
  }

  // Aplainamento de cidades
  for (const c of cfg.cities) {
    const d = Math.max(Math.abs(x - c.x), Math.abs(z - c.z))
    if (d <= cfg.flattenInner) return 0
    if (d < cfg.flattenOuter) {
      const t = (d - cfg.flattenInner) / (cfg.flattenOuter - cfg.flattenInner)
      h *= 0.5 - 0.5 * Math.cos(t * Math.PI)
    }
  }

  // Carve de rios (após cidades/estradas) — U-shape via cos²
  if (cfg.rivers && cfg.rivers.length) {
    const dr = distToPolylines(x, z, cfg.rivers)
    if (dr < cfg.river.carveOuter) {
      const t = dr < cfg.river.carveInner
        ? 0
        : (dr - cfg.river.carveInner) / (cfg.river.carveOuter - cfg.river.carveInner)
      const k = 0.5 + 0.5 * Math.cos(t * Math.PI)
      h -= cfg.river.carveDepth * k * k
    }
  }

  // Lagos terminais: aplaina bacia
  if (cfg.lakes && cfg.lakes.length) {
    for (const lake of cfg.lakes) {
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
        h -= cfg.river.carveDepth * 1.2 * k
      }
    }
  }

  return h
}

function flattenFactor(d, inner, outer) {
  if (d <= inner) return 0
  if (d >= outer) return 1
  const t = (d - inner) / (outer - inner)
  return 0.5 - 0.5 * Math.cos(t * Math.PI)
}

function distPointSegSq(px, pz, ax, az, bx, bz) {
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

function distToPolylines(x, z, polylines) {
  let best = Infinity
  for (const { points } of polylines) {
    for (let k = 2; k < points.length; k += 2) {
      const ax = points[k - 2], az = points[k - 1]
      const bx = points[k],     bz = points[k + 1]
      const d2 = distPointSegSq(x, z, ax, az, bx, bz)
      if (d2 < best) best = d2
    }
  }
  return Math.sqrt(best)
}

/** Distância + altura interpolada na centerline da estrada mais próxima. */
function roadInfoAt(x, z, polylines) {
  let bestDist = Infinity, bestH = 0
  for (const pl of polylines) {
    const pts = pl.points
    const hts = pl.heights  // Float32Array opcional
    const n   = pts.length / 2
    for (let i = 1; i < n; i++) {
      const ax = pts[(i - 1) * 2], az = pts[(i - 1) * 2 + 1]
      const bx = pts[i * 2],       bz = pts[i * 2 + 1]
      const dx = bx - ax, dz = bz - az
      const lenSq = dx * dx + dz * dz
      if (lenSq < 0.0001) continue
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / lenSq))
      const cx = ax + t * dx, cz = az + t * dz
      const d = Math.hypot(x - cx, z - cz)
      if (d < bestDist) {
        bestDist = d
        const ha = hts ? hts[i - 1] : 0
        const hb = hts ? hts[i]     : 0
        bestH = ha + t * (hb - ha)
      }
    }
  }
  return { dist: bestDist, height: bestH }
}

self.addEventListener('message', (ev) => {
  const cfg = ev.data
  const { chunkX, chunkZ, chunkSize, segments, noiseSeed } = cfg

  if (noiseSeed !== _noiseSeed) {
    noise = new SimplexNoise(makeSeededRandomSource(noiseSeed))
    _noiseSeed = noiseSeed
  }

  const N = segments + 1
  const count = N * N
  const heights = new Float32Array(count)
  const colors  = new Float32Array(count * 3)

  const x0 = chunkX * chunkSize
  const z0 = chunkZ * chunkSize

  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const wx = x0 + (i / segments) * chunkSize
      const wz = z0 + (j / segments) * chunkSize
      const h  = heightAt(wx, wz, cfg)
      heights[j * N + i] = h

      const biome = biomeAt(wx, wz, cfg.worldScale)
      const co = (j * N + i) * 3
      const rgb = colorForLayer(biome, h)
      colors[co]     = rgb[0]
      colors[co + 1] = rgb[1]
      colors[co + 2] = rgb[2]
    }
  }

  self.postMessage({ chunkX, chunkZ, heights, colors }, [heights.buffer, colors.buffer])
})

// ── Polaris-style layered splatting: gradiente vertical de cores por bioma ──
// Em vez de uma cor única por bioma, cada vértice mistura entre 2-3 camadas
// (ex: grama→rocha→neve em montanhas) baseado em altitude. Resulta em
// transições visuais ricas sem custo de textura.
const LAYERS = {
  // [altura_pivot, hex] — interpolação linear entre pivots consecutivos
  mountain: [
    [-2,  0x5a7a3a], // base musgo/grama
    [8,   0x6e7a5a], // encosta esverdeada
    [18,  0x807870], // rocha cinza
    [30,  0xb8b5b0], // rocha clara
    [42,  0xf0f5fa], // neve
  ],
  desert: [
    [-12, 0x6e4a2a], // fundo de cânion (ocre escuro)
    [-4,  0x9a6e3a], // areia úmida
    [2,   0xd9c08a], // areia clara (dunas)
    [10,  0xe8d7a8], // areia muito clara
  ],
  forest: [
    [-2, 0x2f5a1f],
    [6,  0x4d8a32],
    [14, 0x6a9a48],
  ],
  plains: [
    [-2, 0x6ea84a],
    [4,  0x8cc060],
    [10, 0xa5cc70],
  ],
  savanna: [
    [-2, 0xa68a3a],
    [6,  0xc2a85a],
    [14, 0xd6c078],
  ],
  tundra: [
    [-2, 0x9aa8a0],
    [6,  0xc0c8c0],
    [14, 0xe8eef0],
  ],
}

function colorForLayer(biome, h) {
  const layers = LAYERS[biome] || LAYERS.plains
  // antes do primeiro pivot
  if (h <= layers[0][0]) {
    const hex = layers[0][1]
    return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255]
  }
  // após o último pivot
  if (h >= layers[layers.length - 1][0]) {
    const hex = layers[layers.length - 1][1]
    return [((hex >> 16) & 0xff) / 255, ((hex >> 8) & 0xff) / 255, (hex & 0xff) / 255]
  }
  // interpola entre pivot[i] e pivot[i+1]
  for (let i = 0; i < layers.length - 1; i++) {
    const [h0, hex0] = layers[i]
    const [h1, hex1] = layers[i + 1]
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0)
      const r0 = ((hex0 >> 16) & 0xff) / 255, g0 = ((hex0 >> 8) & 0xff) / 255, b0 = (hex0 & 0xff) / 255
      const r1 = ((hex1 >> 16) & 0xff) / 255, g1 = ((hex1 >> 8) & 0xff) / 255, b1 = (hex1 & 0xff) / 255
      return [r0 + (r1 - r0) * t, g0 + (g1 - g0) * t, b0 + (b1 - b0) * t]
    }
  }
  return [0.5, 0.5, 0.5]
}
