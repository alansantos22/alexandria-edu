import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CityMeta } from './entities/city-meta.entity';
import { CityChunk } from './entities/city-chunk.entity';
import { UserVehicle } from './entities/user-vehicle.entity';
import { CityPaletteItem } from './entities/city-palette-item.entity';
import { CityBuilding } from './entities/city-building.entity';
import { UserBuildingUnlock } from './entities/user-building-unlock.entity';
import { VehicleCatalog }    from './entities/vehicle-catalog.entity';

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
    @InjectRepository(UserBuildingUnlock)
    private readonly buildingUnlockRepo: Repository<UserBuildingUnlock>,
    @InjectRepository(VehicleCatalog)
    private readonly vehicleCatalogRepo: Repository<VehicleCatalog>,
  ) {}

  // ── City Meta ──────────────────────────────────────────────

  async findMeta(userId: string): Promise<CityMeta | null> {
    return this.metaRepo.findOne({ where: { userId } });
  }

  async createMeta(userId: string): Promise<CityMeta> {
    const seed = randomUUID();
    const worldPos = await this.nextAvailableWorldPosition();
    const frontEdge = await this.deriveFrontEdge(worldPos.x, worldPos.z);
    const meta = this.metaRepo.create({
      userId,
      citySeed: seed,
      worldX: worldPos.x,
      worldZ: worldPos.z,
      frontEdge,
    });
    return this.metaRepo.save(meta);
  }

  /** Escolhe a direção da estrada incidente na ordem de prioridade N>E>S>W.
   *  Cidades isoladas (sem vizinhos no grid) ficam com 0 (N). */
  private async deriveFrontEdge(worldX: number, worldZ: number): Promise<number> {
    const neighbors: Array<[number, number, number]> = [
      [worldX,     worldZ - 1, 0], // N
      [worldX + 1, worldZ,     1], // E
      [worldX,     worldZ + 1, 2], // S
      [worldX - 1, worldZ,     3], // W
    ];
    for (const [nx, nz, edge] of neighbors) {
      const exists = await this.metaRepo.findOne({
        where: { worldX: nx, worldZ: nz },
        select: ['userId'],
      });
      if (exists) return edge;
    }
    return 0;
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
    return this.vehicleRepo.find({ where: { userId }, relations: ['catalog', 'catalog.vehicleAsset', 'catalog.vehicleAsset.material'] });
  }

  async findVehicle(userId: string, vehicleType: string): Promise<UserVehicle | null> {
    return this.vehicleRepo.findOne({ where: { userId, vehicleType } });
  }

  async findVehicleByCatalogId(userId: string, catalogId: string): Promise<UserVehicle | null> {
    return this.vehicleRepo.findOne({ where: { userId, catalogId } });
  }

  async createVehicle(userId: string, vehicleType: string): Promise<UserVehicle> {
    const vehicle = this.vehicleRepo.create({ userId, vehicleType, catalogId: null });
    return this.vehicleRepo.save(vehicle);
  }

  async createVehicleFromCatalog(userId: string, catalogId: string): Promise<UserVehicle> {
    const vehicle = this.vehicleRepo.create({ userId, vehicleType: `catalog:${catalogId}`, catalogId });
    return this.vehicleRepo.save(vehicle);
  }

  async setActiveVehicle(userId: string, vehicleId: string): Promise<void> {
    await this.vehicleRepo.update({ userId }, { isActive: false });
    await this.vehicleRepo.update({ id: vehicleId, userId }, { isActive: true });
  }

  async ensureSkateboard(userId: string): Promise<void> {
    const exists = await this.findVehicle(userId, 'skateboard');
    if (!exists) {
      const vehicle = this.vehicleRepo.create({ userId, vehicleType: 'skateboard', catalogId: null, isActive: true });
      await this.vehicleRepo.save(vehicle);
    }
  }

  // ── Vehicle Catalog (DB-driven) ─────────────────────────────

  findVehicleCatalog(): Promise<VehicleCatalog[]> {
    return this.vehicleCatalogRepo.find({
      where: { isActive: true as any },
      relations: ['vehicleAsset', 'vehicleAsset.material'],
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  findVehicleCatalogItem(id: string): Promise<VehicleCatalog | null> {
    return this.vehicleCatalogRepo.findOne({
      where: { id },
      relations: ['vehicleAsset', 'vehicleAsset.material'],
    });
  }

  // ── Palette ───────────────────────────────────────────────

  async findPalette(): Promise<CityPaletteItem[]> {
    return this.paletteRepo.find({
      where: { isActive: true as any },
      relations: ['buildingAsset', 'buildingAsset.material'],
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  /** Returns only the buildings a user has unlocked + all free (priceCoins=0) buildings,
   *  annotated with availableQty (null = unlimited for free items). */
  async findMyPalette(userId: string): Promise<(CityPaletteItem & { availableQty: number | null })[]> {
    const [all, unlocks, placed] = await Promise.all([
      this.findPalette(),
      this.buildingUnlockRepo.find({ where: { userId } }),
      this.buildingRepo.find({ where: { cityUserId: userId }, select: ['id', 'paletteItemId'] }),
    ]);

    // Count unlocks and placed per palette item
    const unlockCount = new Map<string, number>()
    for (const u of unlocks) {
      unlockCount.set(u.paletteItemId, (unlockCount.get(u.paletteItemId) ?? 0) + 1)
    }
    const placedCount = new Map<string, number>()
    for (const b of placed) {
      placedCount.set(b.paletteItemId, (placedCount.get(b.paletteItemId) ?? 0) + 1)
    }

    return all
      .filter(item => {
        if (item.priceCoins === 0) return true
        const available = (unlockCount.get(item.id) ?? 0) - (placedCount.get(item.id) ?? 0)
        return available > 0
      })
      .map(item => ({
        ...item,
        availableQty: item.priceCoins === 0
          ? null
          : (unlockCount.get(item.id) ?? 0) - (placedCount.get(item.id) ?? 0),
      }));
  }

  async hasUnlockedBuilding(userId: string, paletteItemId: string): Promise<boolean> {
    const count = await this.buildingUnlockRepo.count({ where: { userId, paletteItemId } });
    return count > 0;
  }

  async countAvailablePlacements(userId: string, paletteItemId: string): Promise<number> {
    const [unlocks, placed] = await Promise.all([
      this.buildingUnlockRepo.count({ where: { userId, paletteItemId } }),
      this.buildingRepo.count({ where: { cityUserId: userId, paletteItemId } }),
    ]);
    return unlocks - placed;
  }

  async findPaletteItem(id: string): Promise<CityPaletteItem | null> {
    return this.paletteRepo.findOne({ where: { id, isActive: true as any }, relations: ['buildingAsset', 'buildingAsset.material'] });
  }

  // ── Buildings ─────────────────────────────────────────────

  async findBuildings(userId: string): Promise<CityBuilding[]> {
    return this.buildingRepo.find({
      where: { cityUserId: userId },
      relations: ['paletteItem', 'paletteItem.buildingAsset', 'paletteItem.buildingAsset.material'],
      order: { placedAt: 'ASC' },
    });
  }

  async findBuilding(id: string, userId: string): Promise<CityBuilding | null> {
    return this.buildingRepo.findOne({ where: { id, cityUserId: userId }, relations: ['paletteItem', 'paletteItem.buildingAsset', 'paletteItem.buildingAsset.material'] });
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
        cm.front_edge      AS frontEdge,
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
      GROUP BY cm.user_id, u.username, cm.world_x, cm.world_z, cm.front_edge, cm.city_level, cm.total_buildings
      ORDER BY cm.total_buildings DESC
    `);

    // Fetch buildings separately (avoids GROUP_CONCAT nesting issues)
    const buildingRows: any[] = await this.metaRepo.query(`
      SELECT
        cb.city_user_id    AS cityUserId,
        cb.grid_x          AS gridX,
        cb.grid_z          AS gridZ,
        cb.rotation,
        cp.size_x          AS sizeX,
        cp.size_z          AS sizeZ,
        cp.category,
        cp.model_url       AS modelUrl,
        cpa.scale_factor   AS scaleFactor,
        cm.texture_albedo              AS textureAlbedo,
        cm.texture_normal              AS textureNormal,
        cm.texture_roughness_metalness AS textureRoughnessMetalness,
        cm.texture_ao                  AS textureAo,
        cm.texture_emissive            AS textureEmissive,
        cm.roughness,
        cm.metalness,
        cm.albedo_color_space          AS albedoColorSpace,
        cm.flip_y                      AS flipY
      FROM city_buildings cb
      JOIN city_palette cp ON cp.id = cb.palette_item_id
      LEFT JOIN city_palette_assets cpa ON cpa.palette_item_id = cp.id
      LEFT JOIN city_materials cm ON cm.id = cpa.material_id
    `);

    const buildingsByUser = new Map<string, WorldCityInfo['buildings']>();
    for (const b of buildingRows) {
      if (!buildingsByUser.has(b.cityUserId)) buildingsByUser.set(b.cityUserId, []);
      buildingsByUser.get(b.cityUserId)!.push({
        gridX: b.gridX, gridZ: b.gridZ, rotation: b.rotation,
        sizeX: b.sizeX, sizeZ: b.sizeZ, category: b.category,
        modelUrl: b.modelUrl ?? null,
        scaleFactor: b.scaleFactor ?? 1,
        material: b.textureAlbedo || b.roughness != null ? {
          textureAlbedo:              b.textureAlbedo ?? null,
          textureNormal:              b.textureNormal ?? null,
          textureRoughnessMetalness:  b.textureRoughnessMetalness ?? null,
          textureAo:                  b.textureAo ?? null,
          textureEmissive:            b.textureEmissive ?? null,
          roughness:                  b.roughness ?? 0.7,
          metalness:                  b.metalness ?? 0.0,
          albedoColorSpace:           b.albedoColorSpace ?? 'srgb',
          flipY:                      !!b.flipY,
        } : null,
      });
    }

    return rows.map(row => ({
      ...row,
      landTiles: (row.landTilesRaw ?? '')
        .split(';')
        .filter(Boolean)
        .map((s: string) => {
          const [x, z] = s.split(',').map(Number);
          return { x, z };
        }),
      buildings: buildingsByUser.get(row.userId) ?? [],
      landTilesRaw: undefined,
    }));
  }

  /** Pares de cidades adjacentes no grid (worldX±1 ou worldZ±1).
   *  Retorna cada par uma única vez. `axis` 'x' = vizinhança em X (A à esquerda de B),
   *  'z' = vizinhança em Z (A acima de B). */
  async findAdjacencies(): Promise<WorldAdjacency[]> {
    const rows: any[] = await this.metaRepo.query(`
      SELECT a.user_id AS aUserId, b.user_id AS bUserId, 'x' AS axis
        FROM city_meta a
        JOIN city_meta b
          ON b.world_x = a.world_x + 1 AND b.world_z = a.world_z
      UNION ALL
      SELECT a.user_id AS aUserId, b.user_id AS bUserId, 'z' AS axis
        FROM city_meta a
        JOIN city_meta b
          ON b.world_x = a.world_x AND b.world_z = a.world_z + 1
    `);
    return rows.map(r => ({ aUserId: r.aUserId, bUserId: r.bUserId, axis: r.axis }));
  }
}

export interface WorldAdjacency {
  aUserId: string;
  bUserId: string;
  axis: 'x' | 'z';
}

export interface WorldCityInfo {
  userId: string;
  username: string;
  worldX: number;
  worldZ: number;
  frontEdge: number;
  cityLevel: number;
  totalBuildings: number;
  landTiles: { x: number; z: number }[];
  buildings: {
    gridX: number; gridZ: number; rotation: number;
    sizeX: number; sizeZ: number; category: string;
    modelUrl: string | null;
    scaleFactor: number;
    material: {
      textureAlbedo: string | null;
      textureNormal: string | null;
      textureRoughnessMetalness: string | null;
      textureAo: string | null;
      textureEmissive: string | null;
      roughness: number;
      metalness: number;
      albedoColorSpace: string;
      flipY: boolean;
    } | null;
  }[];
}
