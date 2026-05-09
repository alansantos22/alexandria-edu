import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CoinTransaction, CoinEventType } from './entities/coin-transaction.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EconomyRepository {
  constructor(
    @InjectRepository(CoinTransaction)
    private readonly txRepo: Repository<CoinTransaction>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['coinsBalance'],
    });
    return user?.coinsBalance ?? 0;
  }

  async credit(
    userId: string,
    delta: number,
    eventType: CoinEventType,
    referenceId?: string,
    description?: string,
  ): Promise<CoinTransaction> {
    // Atomic increment via raw query to avoid race conditions
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coinsBalance: () => `coins_balance + ${Math.abs(delta)}` })
      .where('id = :id', { id: userId })
      .execute();

    const newBalance = await this.getBalance(userId);

    // Raw INSERT to bypass TypeORM entity mapping conflicts
    const id = randomUUID();
    await this.txRepo.query(
      `INSERT INTO coin_transactions (id, user_id, delta, balance_after, event_type, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, Math.abs(delta), newBalance, eventType, referenceId ?? null, description ?? null],
    );

    return this.txRepo.findOne({ where: { id } }) as Promise<CoinTransaction>;
  }

  async debit(
    userId: string,
    delta: number,
    eventType: CoinEventType,
    referenceId?: string,
    description?: string,
  ): Promise<CoinTransaction> {
    await this.userRepo
      .createQueryBuilder()
      .update(User)
      .set({ coinsBalance: () => `GREATEST(coins_balance - ${Math.abs(delta)}, 0)` })
      .where('id = :id', { id: userId })
      .execute();

    const newBalance = await this.getBalance(userId);

    const id = randomUUID();
    await this.txRepo.query(
      `INSERT INTO coin_transactions (id, user_id, delta, balance_after, event_type, reference_id, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, -Math.abs(delta), newBalance, eventType, referenceId ?? null, description ?? null],
    );

    return this.txRepo.findOne({ where: { id } }) as Promise<CoinTransaction>;
  }

  async getHistory(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ transactions: CoinTransaction[]; total: number }> {
    const [transactions, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { transactions, total };
  }

  async getRewardAmount(eventType: CoinEventType): Promise<number> {
    // Lê da tabela coin_rewards_config via raw query (TypeORM sem entidade)
    const result: Array<{ coins: number }> = await this.txRepo.query(
      'SELECT coins FROM coin_rewards_config WHERE event_type = ? AND is_active = 1 LIMIT 1',
      [eventType],
    );
    return result[0]?.coins ?? 0;
  }
}
