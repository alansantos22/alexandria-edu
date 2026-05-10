import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CityRepository, WorldCityInfo } from './city.repository';
import { EconomyService } from '../economy/economy.service';
import { UpsertChunkDto } from './dto/upsert-chunk.dto';
import { PurchaseVehicleDto } from './dto/purchase-vehicle.dto';
import { PlaceBuildingDto } from './dto/place-building.dto';
import { VEHICLE_CATALOG } from './city.catalog';
import { CityChunk } from './entities/city-chunk.entity';
import { CityMeta } from './entities/city-meta.entity';
import { UserVehicle } from './entities/user-vehicle.entity';
import { CityPaletteItem } from './entities/city-palette-item.entity';
import { CityBuilding } from './entities/city-building.entity';

@Injectable()
export class CityService {
  constructor(
    private readonly cityRepository: CityRepository,
    private readonly economyService: EconomyService,
  ) {}

  // ── City ─────────────────────────────────────────────────

  async getOrCreateCity(userId: string): Promise<{ meta: CityMeta; chunks: CityChunk[] }> {
    let meta = await this.cityRepository.findMeta(userId);

    if (!meta) {
      meta = await this.cityRepository.createMeta(userId);
      await this.cityRepository.ensureSkateboard(userId);
    }

    const chunks = await this.cityRepository.findChunks(userId);
    return { meta, chunks };
  }

  async getCity(userId: string): Promise<{ meta: CityMeta; chunks: CityChunk[] }> {
    const meta = await this.cityRepository.findMeta(userId);
    if (!meta) throw new NotFoundException('Cidade não encontrada para este usuário.');
    const chunks = await this.cityRepository.findChunks(userId);
    return { meta, chunks };
  }

  // ── Chunks ────────────────────────────────────────────────

  async upsertChunk(userId: string, dto: UpsertChunkDto): Promise<CityChunk> {
    await this.getOrCreateCity(userId);

    const before = await this.cityRepository.findChunks(userId).then((c) =>
      c.find((ch) => ch.chunkX === dto.chunkX && ch.chunkZ === dto.chunkZ),
    );

    const chunk = await this.cityRepository.upsertChunk(userId, dto.chunkX, dto.chunkZ, dto.dataHex);

    const prevCount = before ? countBuildings(before.dataHex) : 0;
    const newCount  = countBuildings(dto.dataHex);
    const delta     = newCount - prevCount;

    if (delta !== 0) {
      await this.cityRepository.incrementBuildings(userId, delta);
    }

    return chunk;
  }

  // ── Palette ───────────────────────────────────────────────

  getPalette(): Promise<CityPaletteItem[]> {
    return this.cityRepository.findPalette();
  }

  getMyPalette(userId: string): Promise<CityPaletteItem[]> {
    return this.cityRepository.findMyPalette(userId);
  }

  // ── Buildings ─────────────────────────────────────────────

  getBuildings(userId: string): Promise<CityBuilding[]> {
    return this.cityRepository.findBuildings(userId);
  }

  async placeBuilding(userId: string, dto: PlaceBuildingDto): Promise<CityBuilding> {
    const meta = await this.cityRepository.findMeta(userId);
    if (!meta) throw new NotFoundException('Cidade não encontrada.');

    const item = await this.cityRepository.findPaletteItem(dto.paletteItemId);
    if (!item) throw new NotFoundException('Item de construção não encontrado.');

    // Ownership check: paid buildings require unlock
    if (item.priceCoins > 0) {
      const owned = await this.cityRepository.hasUnlockedBuilding(userId, dto.paletteItemId);
      if (!owned) {
        throw new BadRequestException(
          'Você precisa desbloquear este edifício no Marketplace antes de posicioná-lo.',
        );
      }
    }

    // CCU budget check
    const ccuAfter = meta.ccuUsed + item.ccuCost;
    if (ccuAfter > meta.ccuLimit) {
      throw new BadRequestException(
        `CCU insuficiente. Necessário: ${item.ccuCost}. Disponível: ${meta.ccuLimit - meta.ccuUsed}.`,
      );
    }

    // Grid overlap check
    const existing = await this.cityRepository.findBuildings(userId);
    const occupied = buildOccupancySet(existing);

    for (let dx = 0; dx < item.sizeX; dx++) {
      for (let dz = 0; dz < item.sizeZ; dz++) {
        if (occupied.has(`${dto.gridX + dx},${dto.gridZ + dz}`)) {
          throw new ConflictException(
            `Posição ocupada em (${dto.gridX + dx}, ${dto.gridZ + dz}).`,
          );
        }
      }
    }

    const building = await this.cityRepository.createBuilding(
      userId,
      dto.paletteItemId,
      dto.gridX,
      dto.gridZ,
      dto.rotation ?? 0,
    );

    await this.cityRepository.updateCCU(userId, item.ccuCost);

    return building;
  }

  async removeBuilding(userId: string, buildingId: string): Promise<void> {
    const building = await this.cityRepository.findBuilding(buildingId, userId);
    if (!building) throw new NotFoundException('Construção não encontrada.');

    await this.cityRepository.deleteBuilding(buildingId, userId);
    await this.cityRepository.updateCCU(userId, -building.paletteItem.ccuCost);
  }

  // ── Vehicles ──────────────────────────────────────────────

  async getVehicles(userId: string): Promise<UserVehicle[]> {
    return this.cityRepository.findVehicles(userId);
  }

  async purchaseVehicle(userId: string, dto: PurchaseVehicleDto): Promise<UserVehicle> {
    const catalogEntry = VEHICLE_CATALOG[dto.vehicleType];

    const existing = await this.cityRepository.findVehicle(userId, dto.vehicleType);
    if (existing) throw new ConflictException('Você já possui este veículo.');

    if (catalogEntry.cost > 0) {
      const result = await this.economyService.spendCoins(
        userId,
        catalogEntry.cost,
        dto.vehicleType,
        `Compra de veículo: ${catalogEntry.label}`,
      );

      if (!result.success) {
        throw new BadRequestException(
          `Saldo insuficiente. Necessário: ${catalogEntry.cost} moedas. Disponível: ${result.balance}.`,
        );
      }
    }

    return this.cityRepository.createVehicle(userId, dto.vehicleType);
  }

  async activateVehicle(userId: string, vehicleId: string): Promise<void> {
    const vehicles = await this.cityRepository.findVehicles(userId);
    const target = vehicles.find((v) => v.id === vehicleId);

    if (!target) throw new NotFoundException('Veículo não encontrado.');

    await this.cityRepository.setActiveVehicle(userId, vehicleId);
  }

  getVehicleCatalog() {
    return Object.entries(VEHICLE_CATALOG).map(([type, data]) => ({ type, ...data }));
  }

  getWorldMap(): Promise<WorldCityInfo[]> {
    return this.cityRepository.findWorldMap();
  }
}

/** Counts non-empty cells (non-'0') in a hex-encoded chunk string. */
function countBuildings(dataHex: string): number {
  let count = 0;
  for (const ch of dataHex) {
    if (ch !== '0') count++;
  }
  return count;
}

/** Builds a Set of "gridX,gridZ" strings for all cells occupied by placed buildings. */
function buildOccupancySet(buildings: CityBuilding[]): Set<string> {
  const occupied = new Set<string>();
  for (const b of buildings) {
    for (let dx = 0; dx < b.paletteItem.sizeX; dx++) {
      for (let dz = 0; dz < b.paletteItem.sizeZ; dz++) {
        occupied.add(`${b.gridX + dx},${b.gridZ + dz}`);
      }
    }
  }
  return occupied;
}
