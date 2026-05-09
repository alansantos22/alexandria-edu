export const GRID_SIZE  = 5   // 5×5 = 25 tiles por bloco
export const TOTAL_TILES = GRID_SIZE * GRID_SIZE  // 25

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
 * Determina o "anel" de expansão (ring 0 = start, ring 4 = canto distante).
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
  if (dist === 0) return { cost: 0,      minCityLevel: 0  }  // já possuído
  if (dist === 1) return { cost: 500,    minCityLevel: 1  }  // anel 1
  if (dist === 2) return { cost: 1_500,  minCityLevel: 5  }  // anel 2
  if (dist === 3) return { cost: 4_000,  minCityLevel: 10 }  // anel 3
  return              { cost: 10_000, minCityLevel: 20 }     // anel 4
}

/** Tile dentro dos limites do grid 5×5. */
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
