import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CityMeta } from './entities/city-meta.entity';
import { CityChunk } from './entities/city-chunk.entity';
import { UserVehicle } from './entities/user-vehicle.entity';
import { CityPaletteItem } from './entities/city-palette-item.entity';
import { CityBuilding } from './entities/city-building.entity';

@Injectable()
export class CityRepository {
  constructor(
    @InjectRepository(CityMeta)
    private readonly metaRepo: Repository<CityMeta>,
    @InjectRepository(CityChunk)
    private readonly chunkRepo: Repository<CityChunk>,
    @InjectRepository(UserVehicle)
    private readonly vehicleRepo: Repository<UserVehicle>,
    @InjectRepository(CityPaletteItem)
    private readonly paletteRepo: Repository<CityPaletteItem>,
    @InjectRepository(CityBuilding)
    private readonly buildingRepo: Repository<CityBuilding>,
  ) {}

  // ── City Meta ──────────────────────────────────────────────

  async findMeta(userId: string): Promise<CityMeta | null> {
    return this.metaRepo.findOne({ where: { userId } });
  }

  async createMeta(userId: string): Promise<CityMeta> {
    const seed = randomUUID();
    const worldPos = await this.nextAvailableWorldPosition();
    const meta = this.metaRepo.create({
      userId,
      citySeed: seed,
      worldX: worldPos.x,
      worldZ: worldPos.z,
    });
    return this.metaRepo.save(meta);
  }

  async incrementBuildings(userId: string, delta: number): Promise<void> {
    await this.metaRepo
      .createQueryBuilder()
      .update(CityMeta)
      .set({ totalBuildings: () => `GREATEST(total_buildings + ${delta}, 0)` })
      .where('user_id = :userId', { userId })
      .execute();
  }

  async updateCCU(userId: string, delta: number): Promise<void> {
    await this.metaRepo
      .createQueryBuilder()
      .update(CityMeta)
      .set({ ccuUsed: () => `GREATEST(LEAST(ccu_used + ${delta}, ccu_limit), 0)` })
      .where('user_id = :userId', { userId })
      .execute();
  }

  /** Assigns a unique (world_x, world_z) in a spiral pattern from origin. */
  private async nextAvailableWorldPosition(): Promise<{ x: number; z: number }> {
    const taken = await this.metaRepo.find({ select: ['worldX', 'worldZ'] });
    const takenSet = new Set(taken.map((m) => `${m.worldX}:${m.worldZ}`));

    let x = 0, z = 0, dx = 0, dz = -1;
    const maxSteps = 10000;

    for (let i = 0; i < maxSteps; i++) {
      if (!takenSet.has(`${x}:${z}`)) return { x, z };
      if (x === z || (x < 0 && x === -z) || (x > 0 && x === 1 - z)) {
        [dx, dz] = [-dz, dx];
      }
      x += dx;
      z += dz;
    }
    return { x: taken.length, z: 0 };
  }

  // ── Chunks ────────────────────────────────────────────────

  async findChunks(userId: string): Promise<CityChunk[]> {
    return this.chunkRepo.find({ where: { userId } });
  }

  async upsertChunk(userId: string, chunkX: number, chunkZ: number, dataHex: string): Promise<CityChunk> {
    const existing = await this.chunkRepo.findOne({ where: { userId, chunkX, chunkZ } });

    if (existing) {
      existing.dataHex = dataHex;
      existing.version += 1;
      return this.chunkRepo.save(existing);
    }

    const chunk = this.chunkRepo.create({ userId, chunkX, chunkZ, dataHex });
    return this.chunkRepo.save(chunk);
  }

  // ── Vehicles ──────────────────────────────────────────────

  async findVehicles(userId: string): Promise<UserVehicle[]> {
    return this.vehicleRepo.find({ where: { userId } });
  }

  async findVehicle(userId: string, vehicleType: string): Promise<UserVehicle | null> {
    return this.vehicleRepo.findOne({ where: { userId, vehicleType } });
  }

  async createVehicle(userId: string, vehicleType: string): Promise<UserVehicle> {
    const vehicle = this.vehicleRepo.create({ userId, vehicleType });
    return this.vehicleRepo.save(vehicle);
  }

  async setActiveVehicle(userId: string, vehicleId: string): Promise<void> {
    await this.vehicleRepo.update({ userId }, { isActive: false });
    await this.vehicleRepo.update({ id: vehicleId, userId }, { isActive: true });
  }

  async ensureSkateboard(userId: string): Promise<void> {
    const exists = await this.findVehicle(userId, 'skateboard');
    if (!exists) {
      const vehicle = this.vehicleRepo.create({ userId, vehicleType: 'skateboard', isActive: true });
      await this.vehicleRepo.save(vehicle);
    }
  }

  // ── Palette ───────────────────────────────────────────────

  async findPalette(): Promise<CityPaletteItem[]> {
    return this.paletteRepo.find({
      where: { isActive: true as any },
      relations: ['buildingAsset'],
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findPaletteItem(id: string): Promise<CityPaletteItem | null> {
    return this.paletteRepo.findOne({ where: { id, isActive: true as any }, relations: ['buildingAsset'] });
  }

  // ── Buildings ─────────────────────────────────────────────

  async findBuildings(userId: string): Promise<CityBuilding[]> {
    return this.buildingRepo.find({
      where: { cityUserId: userId },
      relations: ['paletteItem', 'paletteItem.buildingAsset'],
      order: { placedAt: 'ASC' },
    });
  }

  async findBuilding(id: string, userId: string): Promise<CityBuilding | null> {
    return this.buildingRepo.findOne({ where: { id, cityUserId: userId }, relations: ['paletteItem', 'paletteItem.buildingAsset'] });
  }

  async createBuilding(
    userId: string,
    paletteItemId: string,
    gridX: number,
    gridZ: number,
    rotation: number,
  ): Promise<CityBuilding> {
    const building = this.buildingRepo.create({
      id: randomUUID(),
      cityUserId: userId,
      paletteItemId,
      gridX,
      gridZ,
      rotation,
    });
    return this.buildingRepo.save(building);
  }

  async deleteBuilding(id: string, userId: string): Promise<void> {
    await this.buildingRepo.delete({ id, cityUserId: userId });
  }

  // ── World Map ─────────────────────────────────────────

  async findWorldMap(): Promise<WorldCityInfo[]> {
    const rows: any[] = await this.metaRepo.query(`
      SELECT
        cm.user_id         AS userId,
        u.username,
        cm.world_x         AS worldX,
        cm.world_z         AS worldZ,
        cm.city_level      AS cityLevel,
        cm.total_buildings AS totalBuildings,
        GROUP_CONCAT(
          CONCAT(lt.tile_x, ',', lt.tile_z)
          ORDER BY lt.tile_x, lt.tile_z
          SEPARATOR ';'
        ) AS landTilesRaw
      FROM city_meta cm
      JOIN users u ON u.id = cm.user_id
      LEFT JOIN land_tiles lt ON lt.city_user_id = cm.user_id
      GROUP BY cm.user_id, u.username, cm.world_x, cm.world_z, cm.city_level, cm.total_buildings
      ORDER BY cm.total_buildings DESC
    `);

    return rows.map(row => ({
      ...row,
      landTiles: (row.landTilesRaw ?? '')
        .split(';')
        .filter(Boolean)
        .map((s: string) => {
          const [x, z] = s.split(',').map(Number);
          return { x, z };
        }),
      landTilesRaw: undefined,
    }));
  }
}

export interface WorldCityInfo {
  userId: string;
  username: string;
  worldX: number;
  worldZ: number;
  cityLevel: number;
  totalBuildings: number;
  landTiles: { x: number; z: number }[];
}
