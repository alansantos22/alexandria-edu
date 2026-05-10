import { Module }         from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';
import { MarketplaceItem }  from '../marketplace/entities/marketplace-item.entity';
import { CityPaletteItem }  from '../city/entities/city-palette-item.entity';
import { BuildingAsset }    from '../city/entities/building-asset.entity';
import { CityMaterial }     from '../city/entities/city-material.entity';
import { AdminController }  from './admin.controller';
import { AdminService }     from './admin.service';

@Module({
  imports:     [TypeOrmModule.forFeature([MarketplaceItem, CityPaletteItem, BuildingAsset, CityMaterial])],
  controllers: [AdminController],
  providers:   [AdminService],
})
export class AdminModule {}
