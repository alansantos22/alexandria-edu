/**
 * Atribuição determinística de bioma a partir de coordenadas de mundo (worldX, worldZ).
 *
 * Algoritmo: 3 camadas de value-noise 2D bilinear (sem dependências) — elevation,
 * temperature e humidity — classificadas em 6 biomas. Mesma lógica EXISTE no
 * frontend em `frontend/src/composables/biome.util.js` — qualquer alteração aqui
 * DEVE ser refletida lá pra manter cliente e servidor coerentes.
 */

export type Biome = 'plains' | 'forest' | 'desert' | 'mountain' | 'tundra' | 'savanna';

export const BIOMES: readonly Biome[] = ['plains', 'forest', 'desert', 'mountain', 'tundra', 'savanna'] as const;

const SALT_ELEV  = 0x9c3f6c;
const SALT_TEMP  = 0x7e21a3;
const SALT_HUMID = 0x4b8d11;

function _hash2(ix: number, iz: number, salt: number): number {
  let h = (Math.imul(ix | 0, 374761393)) ^ (Math.imul(iz | 0, 668265263)) ^ salt;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}

function _smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function _valueNoise(x: number, z: number, salt: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fz = z - iz;
  const a = _hash2(ix,     iz,     salt);
  const b = _hash2(ix + 1, iz,     salt);
  const c = _hash2(ix,     iz + 1, salt);
  const d = _hash2(ix + 1, iz + 1, salt);
  const ux = _smooth(fx);
  const uz = _smooth(fz);
  return (1 - uz) * ((1 - ux) * a + ux * b) + uz * ((1 - ux) * c + ux * d);
}

/** Bioma para coordenadas de world grid (worldX, worldZ — inteiros como em city_meta). */
export function assignBiome(worldX: number, worldZ: number): Biome {
  // Frequências escolhidas pra dar clusters de ~3-5 cidades por bioma no grid
  const elev  = _valueNoise(worldX * 0.18 + 1.7, worldZ * 0.18 + 9.3, SALT_ELEV);
  if (elev > 0.72) return 'mountain';

  const temp  = _valueNoise(worldX * 0.12 + 5.1, worldZ * 0.12 + 2.4, SALT_TEMP);
  const humid = _valueNoise(worldX * 0.14 + 0.3, worldZ * 0.14 + 7.8, SALT_HUMID);

  if (temp < 0.28) return 'tundra';
  if (temp > 0.70 && humid < 0.30) return 'desert';
  if (temp > 0.55 && humid < 0.50) return 'savanna';
  if (humid > 0.62) return 'forest';
  return 'plains';
}
