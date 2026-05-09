export interface TileDto {
  tileX: number
  tileZ: number
  purchasedAt?: Date
}

export interface AvailableTileDto {
  tileX: number
  tileZ: number
  cost: number
  minCityLevel: number
}

export interface LandResponseDto {
  owned: TileDto[]
  available: AvailableTileDto[]
  total: number
  ownedCount: number
  percent: number
}

export interface PurchaseResultDto {
  tile: { tileX: number; tileZ: number }
  balance: number
  percent: number
}
