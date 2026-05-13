export const GRID_SIZE  = 15  // 15×15 = 225 tiles por bloco
export const TOTAL_TILES = GRID_SIZE * GRID_SIZE  // 225

// Tiles pré-possuídos ao criar/inicializar uma cidade (canto da estrada)
export const STARTING_TILES: readonly [number, number][] = [
  [0, 0], [1, 0],
  [0, 1], [1, 1],
] as const

export interface TileCost {
  cost: number
  minCityLevel: number
}

/**
 * Distância de Chebyshev do tile ao tile de start mais próximo.
 * Determina o "anel" de expansão (ring 0 = start, ring 13 = canto distante).
 */
function distanceToStart(tileX: number, tileZ: number): number {
  return Math.min(
    ...STARTING_TILES.map(([sx, sz]) =>
      Math.max(Math.abs(tileX - sx), Math.abs(tileZ - sz)),
    ),
  )
}

/** Retorna custo em moedas e level mínimo de cidade para comprar o tile. */
export function getTileCost(tileX: number, tileZ: number): TileCost {
  const dist = distanceToStart(tileX, tileZ)
  if (dist === 0) return { cost: 0,        minCityLevel: 0  }  // já possuído
  if (dist === 1) return { cost: 500,      minCityLevel: 1  }  // anel 1
  if (dist === 2) return { cost: 1_500,    minCityLevel: 5  }  // anel 2
  if (dist === 3) return { cost: 4_000,    minCityLevel: 10 }  // anel 3
  if (dist === 4) return { cost: 10_000,   minCityLevel: 20 }  // anel 4
  if (dist === 5)  return { cost: 25_000,    minCityLevel: 30 }  // anel 5
  if (dist === 6)  return { cost: 65_000,    minCityLevel: 42 }  // anel 6
  if (dist === 7)  return { cost: 175_000,   minCityLevel: 55 }  // anel 7
  if (dist === 8)  return { cost: 500_000,   minCityLevel: 70 }  // anel 8
  if (dist === 9)  return { cost: 1_250_000, minCityLevel: 80 }  // anel 9
  if (dist === 10) return { cost: 3_000_000, minCityLevel: 88 }  // anel 10
  if (dist === 11) return { cost: 7_000_000, minCityLevel: 94 }  // anel 11
  if (dist === 12) return { cost: 15_000_000, minCityLevel: 97 } // anel 12
  return                  { cost: 35_000_000, minCityLevel: 100 } // anel 13
}

/** Tile dentro dos limites do grid 15×15. */
export function isValidTile(tileX: number, tileZ: number): boolean {
  return tileX >= 0 && tileX < GRID_SIZE && tileZ >= 0 && tileZ < GRID_SIZE
}

/** Regra CS: só pode comprar se pelo menos 1 vizinho (4-dir) já for possuído. */
export function isAdjacentToOwned(
  tileX: number,
  tileZ: number,
  ownedSet: Set<string>,
): boolean {
  return [
    [tileX - 1, tileZ],
    [tileX + 1, tileZ],
    [tileX, tileZ - 1],
    [tileX, tileZ + 1],
  ].some(([x, z]) => ownedSet.has(`${x},${z}`))
}
