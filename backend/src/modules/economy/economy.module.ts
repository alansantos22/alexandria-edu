import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { User } from '../users/entities/user.entity';
import { EconomyRepository } from './economy.repository';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoinTransaction, User])],
  controllers: [EconomyController],
  providers: [EconomyRepository, EconomyService],
  exports: [EconomyService],
})
export class EconomyModule {}
