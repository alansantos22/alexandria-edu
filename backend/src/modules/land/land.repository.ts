import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { LandTile } from './entities/land-tile.entity'

@Injectable()
export class LandRepository {
  constructor(
    @InjectRepository(LandTile)
    private readonly repo: Repository<LandTile>,
  ) {}

  findByCityUser(cityUserId: string): Promise<LandTile[]> {
    return this.repo.find({
      where: { cityUserId },
      order: { purchasedAt: 'ASC' },
    })
  }

  findTile(cityUserId: string, tileX: number, tileZ: number): Promise<LandTile | null> {
    return this.repo.findOne({ where: { cityUserId, tileX, tileZ } })
  }

  async createTile(cityUserId: string, tileX: number, tileZ: number): Promise<LandTile> {
    const tile = this.repo.create({ cityUserId, tileX, tileZ })
    return this.repo.save(tile)
  }

  async seedStartingTiles(cityUserId: string, startingTiles: readonly [number, number][]): Promise<LandTile[]> {
    const tiles = startingTiles.map(([tileX, tileZ]) =>
      this.repo.create({ cityUserId, tileX, tileZ }),
    )
    return this.repo.save(tiles)
  }
}
