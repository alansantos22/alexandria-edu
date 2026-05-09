import { Module }         from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';
import { MarketplaceItem } from '../marketplace/entities/marketplace-item.entity';
import { AdminController } from './admin.controller';
import { AdminService }    from './admin.service';

@Module({
  imports:     [TypeOrmModule.forFeature([MarketplaceItem])],
  controllers: [AdminController],
  providers:   [AdminService],
})
export class AdminModule {}
