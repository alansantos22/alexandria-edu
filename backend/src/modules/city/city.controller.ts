import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CityService } from './city.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UpsertChunkDto } from './dto/upsert-chunk.dto';
import { PurchaseVehicleDto } from './dto/purchase-vehicle.dto';
import { PlaceBuildingDto } from './dto/place-building.dto';

@Controller('city')
export class CityController {
  constructor(private readonly cityService: CityService) {}

  // ── My city (authenticated) ─────────────────────────────

  @Get('me')
  getMyCity(@CurrentUser('id') userId: string) {
    return this.cityService.getOrCreateCity(userId);
  }

  @Patch('chunk')
  upsertChunk(@CurrentUser('id') userId: string, @Body() dto: UpsertChunkDto) {
    return this.cityService.upsertChunk(userId, dto);
  }

  // ── Palette ───────────────────────────────────────────────

  @Get('palette')
  @Public()
  getPalette() {
    return this.cityService.getPalette();
  }

  // ── Buildings ─────────────────────────────────────────────

  @Get('buildings')
  getMyBuildings(@CurrentUser('id') userId: string) {
    return this.cityService.getBuildings(userId);
  }

  @Post('buildings')
  placeBuilding(@CurrentUser('id') userId: string, @Body() dto: PlaceBuildingDto) {
    return this.cityService.placeBuilding(userId, dto);
  }

  @Delete('buildings/:buildingId')
  removeBuilding(
    @CurrentUser('id') userId: string,
    @Param('buildingId') buildingId: string,
  ) {
    return this.cityService.removeBuilding(userId, buildingId);
  }

  // ── Vehicles ─────────────────────────────────────────────

  @Get('vehicles/catalog')
  @Public()
  getVehicleCatalog() {
    return this.cityService.getVehicleCatalog();
  }

  @Get('vehicles')
  getMyVehicles(@CurrentUser('id') userId: string) {
    return this.cityService.getVehicles(userId);
  }

  @Post('vehicles/purchase')
  purchaseVehicle(@CurrentUser('id') userId: string, @Body() dto: PurchaseVehicleDto) {
    return this.cityService.purchaseVehicle(userId, dto);
  }

  @Patch('vehicles/:vehicleId/activate')
  activateVehicle(@CurrentUser('id') userId: string, @Param('vehicleId') vehicleId: string) {
    return this.cityService.activateVehicle(userId, vehicleId);
  }

  // ── World map (must come before :userId to avoid param collision) ──

  @Get('world-map')
  @Public()
  getWorldMap() {
    return this.cityService.getWorldMap();
  }

  // ── Public city view ─────────────────────────────────────

  @Get(':userId')
  @Public()
  getCity(@Param('userId') userId: string) {
    return this.cityService.getCity(userId);
  }
}
