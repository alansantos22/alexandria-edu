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
import { VEHICLE_CATALOG } from './city.catalog';
import { CityChunk } from './entities/city-chunk.entity';
import { CityMeta } from './entities/city-meta.entity';
import { UserVehicle } from './entities/user-vehicle.entity';

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
