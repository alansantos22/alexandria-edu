import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { LandRepository } from './land.repository'
import { EconomyService } from '../economy/economy.service'
import { CityMeta } from '../city/entities/city-meta.entity'

import { LandResponseDto, PurchaseResultDto } from './dto/land-response.dto'
import {
  GRID_SIZE,
  STARTING_TILES,
  TOTAL_TILES,
  getTileCost,
  isAdjacentToOwned,
  isValidTile,
} from './land.config'

@Injectable()
export class LandService {
  constructor(
    private readonly landRepository: LandRepository,
    private readonly economyService: EconomyService,
    @InjectRepository(CityMeta)
    private readonly cityMetaRepo: Repository<CityMeta>,
  ) {}

  async getLand(cityUserId: string): Promise<LandResponseDto> {
    let owned = await this.landRepository.findByCityUser(cityUserId)

    // Auto-seed starting tiles on first access (user has never purchased/received tiles)
    if (owned.length === 0) {
      owned = await this.landRepository.seedStartingTiles(cityUserId, STARTING_TILES)
    }

    const ownedSet = new Set(owned.map(t => `${t.tileX},${t.tileZ}`))

    const available: LandResponseDto['available'] = []
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let z = 0; z < GRID_SIZE; z++) {
        if (ownedSet.has(`${x},${z}`)) continue
        if (!isAdjacentToOwned(x, z, ownedSet)) continue
        const { cost, minCityLevel } = getTileCost(x, z)
        available.push({ tileX: x, tileZ: z, cost, minCityLevel })
      }
    }

    return {
      owned:      owned.map(t => ({ tileX: t.tileX, tileZ: t.tileZ, purchasedAt: t.purchasedAt })),
      available,
      total:      TOTAL_TILES,
      ownedCount: owned.length,
      percent:    Math.round((owned.length / TOTAL_TILES) * 100),
    }
  }

  async purchaseTile(userId: string, tileX: number, tileZ: number): Promise<PurchaseResultDto> {
    if (!isValidTile(tileX, tileZ)) {
      throw new BadRequestException('Tile fora dos limites do grid (0–14).')
    }

    const meta = await this.cityMetaRepo.findOne({ where: { userId } })
    if (!meta) throw new NotFoundException('Cidade não encontrada.')

    const existing = await this.landRepository.findTile(userId, tileX, tileZ)
    if (existing) throw new BadRequestException('Este tile já pertence à sua cidade.')

    const owned    = await this.landRepository.findByCityUser(userId)
    const ownedSet = new Set(owned.map(t => `${t.tileX},${t.tileZ}`))

    // Tiles iniciais não precisam de adjacência (são o ponto de partida)
    const isStarting = STARTING_TILES.some(([sx, sz]) => sx === tileX && sz === tileZ)
    if (!isStarting && !isAdjacentToOwned(tileX, tileZ, ownedSet)) {
      throw new BadRequestException(
        'Você só pode comprar tiles adjacentes aos já possuídos.',
      )
    }

    const { cost, minCityLevel } = getTileCost(tileX, tileZ)

    if (meta.cityLevel < minCityLevel) {
      throw new BadRequestException(
        `Nível de cidade insuficiente. Necessário: ${minCityLevel}. Atual: ${meta.cityLevel}.`,
      )
    }

    if (cost > 0) {
      const result = await this.economyService.spendCoins(
        userId,
        cost,
        `land_tile_${tileX}_${tileZ}`,
        `Expansão de terreno — tile (${tileX}, ${tileZ})`,
      )
      if (!result.success) {
        throw new BadRequestException(
          `Moedas insuficientes. Necessário: ${cost}. Disponível: ${result.balance}.`,
        )
      }
    }

    await this.landRepository.createTile(userId, tileX, tileZ)

    const [{ balance }] = await Promise.all([this.economyService.getBalance(userId)])
    const newCount = owned.length + 1

    return {
      tile:    { tileX, tileZ },
      balance: balance,
      percent: Math.round((newCount / TOTAL_TILES) * 100),
    }
  }
}
