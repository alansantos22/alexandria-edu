import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { LandTile } from './entities/land-tile.entity'
import { CityMeta } from '../city/entities/city-meta.entity'

import { EconomyModule } from '../economy/economy.module'

import { LandRepository }  from './land.repository'
import { LandService }     from './land.service'
import { LandController }  from './land.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([LandTile, CityMeta]),
    EconomyModule,
  ],
  providers:   [LandRepository, LandService],
  controllers: [LandController],
  exports:     [LandService],
})
export class LandModule {}
