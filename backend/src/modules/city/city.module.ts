import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CityMeta } from './entities/city-meta.entity';
import { CityChunk } from './entities/city-chunk.entity';
import { UserVehicle } from './entities/user-vehicle.entity';
import { CityPaletteItem } from './entities/city-palette-item.entity';
import { CityBuilding } from './entities/city-building.entity';
import { BuildingAsset } from './entities/building-asset.entity';
import { CityMaterial }  from './entities/city-material.entity';
import { UserBuildingUnlock } from './entities/user-building-unlock.entity';
import { VehicleCatalog }    from './entities/vehicle-catalog.entity';
import { VehicleAsset }      from './entities/vehicle-asset.entity';
import { CityRepository } from './city.repository';
import { CityService } from './city.service';
import { CityController } from './city.controller';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CityMeta, CityChunk, UserVehicle, CityPaletteItem, CityBuilding, BuildingAsset, CityMaterial, UserBuildingUnlock, VehicleCatalog, VehicleAsset]),
    EconomyModule,
  ],
  controllers: [CityController],
  providers: [CityRepository, CityService],
  exports: [CityService],
})
export class CityModule {}
