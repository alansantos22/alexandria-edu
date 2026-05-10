import { Module }          from '@nestjs/common';
import { TypeOrmModule }   from '@nestjs/typeorm';

import { EconomyModule }   from '../economy/economy.module';

import { MarketplaceItem }              from './entities/marketplace-item.entity';
import { MarketplaceSeason }            from './entities/marketplace-season.entity';
import { UserInventory }                from './entities/user-inventory.entity';
import { UserProfileCustomization }     from './entities/user-profile-customization.entity';
import { RedemptionToken }              from './entities/redemption-token.entity';
import { CityPaletteItem }              from '../city/entities/city-palette-item.entity';
import { UserBuildingUnlock }           from '../city/entities/user-building-unlock.entity';

import { MarketplaceRepository }  from './marketplace.repository';
import { MarketplaceService }     from './marketplace.service';
import { MarketplaceController }  from './marketplace.controller';
import { AdminVaultController }   from './admin-vault.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceItem,
      MarketplaceSeason,
      UserInventory,
      UserProfileCustomization,
      RedemptionToken,
      CityPaletteItem,
      UserBuildingUnlock,
    ]),
    EconomyModule,
  ],
  controllers: [MarketplaceController, AdminVaultController],
  providers:   [MarketplaceRepository, MarketplaceService],
  exports:     [MarketplaceService],
})
export class MarketplaceModule {}
