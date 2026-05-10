import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityMeta } from './entities/city-meta.entity';
import { CityChunk } from './entities/city-chunk.entity';
import { UserVehicle } from './entities/user-vehicle.entity';
import { CityPaletteItem } from './entities/city-palette-item.entity';
import { CityBuilding } from './entities/city-building.entity';
import { BuildingAsset } from './entities/building-asset.entity';
import { CityRepository } from './city.repository';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CityMeta, CityChunk, UserVehicle, CityPaletteItem, CityBuilding, BuildingAsset]),
    EconomyModule,
  ],
  controllers: [CityController],
  providers: [CityRepository, CityService],
  exports: [CityService],
})
export class CityModule {}
