import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CoinTransaction } from './entities/coin-transaction.entity';
import { UserFlag } from './entities/user-flag.entity';
import { User } from '../users/entities/user.entity';
import { EconomyRepository } from './economy.repository';
import { EconomyService } from './economy.service';
import { EconomyController } from './economy.controller';
import { AdminEconomyController } from './admin-economy.controller';
import { AntiFraudService } from './anti-fraud.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CoinTransaction, UserFlag, User]),
    ScheduleModule.forRoot(),
  ],
  controllers: [EconomyController, AdminEconomyController],
  providers: [EconomyRepository, EconomyService, AntiFraudService],
  exports: [EconomyService],
})
export class EconomyModule {}
