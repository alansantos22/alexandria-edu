/**
 * Mirror EXATO de `backend/src/modules/city/biome.util.ts`.
 * Algoritmo determinístico — mesma classificação no cliente e no servidor.
 *
 * Função auxiliar `biomeAt(x, z)` aceita COORDENADAS DE MUNDO em unidades (não grid).
 * Internamente converte para escala do grid antes de classificar — assim
 * `assignBiome(worldX, worldZ)` (chamado pelo backend com inteiros) e
 * `biomeAt(x, z)` (chamado pelo terreno tesselado com floats) usam a mesma função.
 */

export const BIOMES = ['plains', 'forest', 'desert', 'mountain', 'tundra', 'savanna']

const SALT_ELEV  = 0x9c3f6c
const SALT_TEMP  = 0x7e21a3
const SALT_HUMID = 0x4b8d11

function _hash2(ix, iz, salt) {
  let h = Math.imul(ix | 0, 374761393) ^ Math.imul(iz | 0, 668265263) ^ salt
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff
}

function _smooth(t) { return t * t * (3 - 2 * t) }

function _valueNoise(x, z, salt) {
  const ix = Math.floor(x)
  const iz = Math.floor(z)
  const fx = x - ix
  const fz = z - iz
  const a = _hash2(ix,     iz,     salt)
  const b = _hash2(ix + 1, iz,     salt)
  const c = _hash2(ix,     iz + 1, salt)
  const d = _hash2(ix + 1, iz + 1, salt)
  const ux = _smooth(fx)
  const uz = _smooth(fz)
  return (1 - uz) * ((1 - ux) * a + ux * b) + uz * ((1 - ux) * c + ux * d)
}

/** Mesma lógica do backend `assignBiome` — entrada em unidades de world GRID.
 *  Frequências ↑1.8× em relação ao backend original — biomas mais compactos
 *  (~3–5 cidades por bioma) para variedade visual ao longo da highway. */
export function assignBiome(worldX, worldZ) {
  const elev = _valueNoise(worldX * 0.32 + 1.7, worldZ * 0.32 + 9.3, SALT_ELEV)
  if (elev > 0.72) return 'mountain'

  const temp  = _valueNoise(worldX * 0.22 + 5.1, worldZ * 0.22 + 2.4, SALT_TEMP)
  const humid = _valueNoise(worldX * 0.25 + 0.3, worldZ * 0.25 + 7.8, SALT_HUMID)

  if (temp < 0.28) return 'tundra'
  if (temp > 0.70 && humid < 0.30) return 'desert'
  if (temp > 0.55 && humid < 0.50) return 'savanna'
  if (humid > 0.62) return 'forest'
  return 'plains'
}

/** Para uso no terreno tesselado: aceita coordenadas em UNIDADES de mundo (não grid).
 *  Converte para escala do grid (WORLD_SCALE = 80) e classifica. */
export function biomeAt(x, z, worldScale = 80) {
  return assignBiome(x / worldScale, z / worldScale)
}

/** Amplitude do FBM modulada por bioma. Multiplicador sobre TERRAIN_AMPLITUDE base. */
export const BIOME_AMPLITUDE = {
  plains:   1.0,
  forest:   1.3,
  desert:   0.7,
  mountain: 12.0,
  tundra:   1.4,
  savanna:  0.9,
}

/** Cor de superfície (vertex color) por bioma. Hex em 0xRRGGBB. */
export const BIOME_COLOR = {
  plains:   0x4d8a32,
  forest:   0x2a5f1a,
  desert:   0xcfb574,
  mountain: 0x70655c,
  tundra:   0xc4d4e4,
  savanna:  0xa89b48,
}
