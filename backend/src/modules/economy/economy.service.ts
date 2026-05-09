import { Injectable, Logger } from '@nestjs/common';
import { EconomyRepository } from './economy.repository';
import { CoinEventType } from './entities/coin-transaction.entity';
import { CoinTransaction } from './entities/coin-transaction.entity';

@Injectable()
export class EconomyService {
  private readonly logger = new Logger(EconomyService.name);

  constructor(private readonly economyRepository: EconomyRepository) {}

  async getBalance(userId: string): Promise<{ balance: number }> {
    const balance = await this.economyRepository.getBalance(userId);
    return { balance };
  }

  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ transactions: CoinTransaction[]; total: number; page: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    const { transactions, total } = await this.economyRepository.getHistory(userId, limit, offset);
    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Premiação automática baseada em evento.
   * Lê o valor configurado em coin_rewards_config.
   * Retorna null se o evento não estiver ativo ou tiver 0 moedas.
   */
  async awardCoins(
    userId: string,
    eventType: CoinEventType,
    referenceId?: string,
  ): Promise<CoinTransaction | null> {
    const coins = await this.economyRepository.getRewardAmount(eventType);

    if (coins <= 0) {
      this.logger.debug(`Event ${eventType} has no reward configured, skipping.`);
      return null;
    }

    const descriptions: Record<CoinEventType, string> = {
      LESSON_COMPLETE:          'Aula concluída',
      QUIZ_PASS_70:             'Avaliação aprovada (≥ 70%)',
      QUIZ_PASS_90:             'Avaliação com nota excelente (≥ 90%)',
      DAILY_STREAK:             'Streak diário mantido',
      COURSE_PURCHASE_CASHBACK: 'Cashback da compra do curso',
      MARKETPLACE_PURCHASE:     'Compra no marketplace',
    };

    this.logger.log(`Awarding ${coins} coins to user ${userId} for ${eventType}`);

    return this.economyRepository.credit(
      userId,
      coins,
      eventType,
      referenceId,
      descriptions[eventType],
    );
  }

  /**
   * Débito de moedas (compra no marketplace, etc.).
   * Retorna false se saldo insuficiente.
   */
  async spendCoins(
    userId: string,
    amount: number,
    referenceId?: string,
    description?: string,
  ): Promise<{ success: boolean; balance: number }> {
    const currentBalance = await this.economyRepository.getBalance(userId);

    if (currentBalance < amount) {
      return { success: false, balance: currentBalance };
    }

    await this.economyRepository.debit(
      userId,
      amount,
      'MARKETPLACE_PURCHASE',
      referenceId,
      description ?? 'Compra no marketplace',
    );

    const newBalance = await this.economyRepository.getBalance(userId);
    return { success: true, balance: newBalance };
  }

  /** Simulação de cashback de compra de curso */
  async simulateCoursePurchaseCashback(userId: string): Promise<CoinTransaction | null> {
    return this.awardCoins(userId, 'COURSE_PURCHASE_CASHBACK');
  }
}
