import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CoinTransaction, CoinEventType } from './entities/coin-transaction.entity';
import { UserFlag, FlagType } from './entities/user-flag.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class EconomyRepository {
  constructor(
    @InjectRepository(CoinTransaction)
    private readonly txRepo: Repository<CoinTransaction>,
    @InjectRepository(UserFlag)
    private readonly flagRepo: Repository<UserFlag>,
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

  // ── Admin adjustment ──────────────────────────────────────────────────────

  async adminAdjust(
    userId: string,
    delta: number,
    note: string,
  ): Promise<CoinTransaction> {
    if (delta > 0) {
      return this.credit(userId, delta, 'ADMIN_ADJUSTMENT', undefined, note);
    } else {
      return this.debit(userId, Math.abs(delta), 'ADMIN_ADJUSTMENT', undefined, note);
    }
  }

  async getUsersWithBalance(
    page: number,
    limit: number,
  ): Promise<{ users: Pick<User, 'id' | 'username' | 'email' | 'coinsBalance'>[]; total: number }> {
    const [users, total] = await this.userRepo.findAndCount({
      select: ['id', 'username', 'email', 'coinsBalance'],
      order: { coinsBalance: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { users, total };
  }

  // ── User flags / Anti-Fraud ───────────────────────────────────────────────

  async createFlag(
    userId: string,
    flagType: FlagType,
    detail: string,
  ): Promise<UserFlag> {
    const flag = this.flagRepo.create({
      id: randomUUID(),
      userId,
      flagType,
      detail,
      isReviewed: false,
    });
    return this.flagRepo.save(flag);
  }

  async getFlaggedUsers(
    page: number,
    limit: number,
    onlyPending: boolean,
  ) {
    const qb = this.flagRepo
      .createQueryBuilder('f')
      .innerJoin(User, 'u', 'u.id = f.user_id')
      .select([
        'f.id            AS flag_id',
        'f.user_id       AS user_id',
        'u.username      AS username',
        'u.email         AS email',
        'u.coins_balance AS coins_balance',
        'f.flag_type     AS flag_type',
        'f.detail        AS detail',
        'f.is_reviewed   AS is_reviewed',
        'f.created_at    AS created_at',
      ])
      .orderBy('f.created_at', 'DESC');

    if (onlyPending) qb.where('f.is_reviewed = 0');

    const [flags, total] = await Promise.all([
      qb.limit(limit).offset((page - 1) * limit).getRawMany(),
      qb.getCount(),
    ]);
    return { flags, total };
  }

  async reviewFlag(flagId: string, reviewedBy: string): Promise<void> {
    await this.flagRepo.update(flagId, {
      isReviewed: true,
      reviewedBy,
      reviewedAt: new Date(),
    });
  }

  /** Cron: detecta usuários que completaram >= 5 aulas em < 3 minutos */
  async detectSpeedAnomalies(): Promise<{ userId: string; count: number }[]> {
    const rows: Array<{ user_id: string; cnt: number }> = await this.txRepo.query(`
      SELECT user_id, COUNT(*) AS cnt
      FROM coin_transactions
      WHERE event_type = 'LESSON_COMPLETE'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 3 MINUTE)
      GROUP BY user_id
      HAVING cnt >= 5
    `);
    return rows.map((r) => ({ userId: r.user_id, count: r.cnt }));
  }

  async flagAlreadyExists(userId: string, flagType: FlagType, since: Date): Promise<boolean> {
    const count = await this.flagRepo
      .createQueryBuilder('f')
      .where('f.user_id = :userId', { userId })
      .andWhere('f.flag_type = :flagType', { flagType })
      .andWhere('f.created_at >= :since', { since })
      .getCount();
    return count > 0;
  }
}

