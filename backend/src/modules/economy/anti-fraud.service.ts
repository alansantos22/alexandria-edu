import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EconomyRepository } from './economy.repository';

@Injectable()
export class AntiFraudService {
  private readonly logger = new Logger(AntiFraudService.name);

  constructor(private readonly economyRepository: EconomyRepository) {}

  /**
   * Roda a cada 5 minutos.
   * Detecta usuários que completaram >= 5 aulas em menos de 3 minutos.
   * Cria um UserFlag do tipo ANOMALY_SPEED caso ainda não exista flag recente.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async detectAnomalies(): Promise<void> {
    try {
      const anomalies = await this.economyRepository.detectSpeedAnomalies();

      for (const { userId, count } of anomalies) {
        const since = new Date(Date.now() - 10 * 60_000); // janela de 10 min para evitar flags duplicadas
        const alreadyFlagged = await this.economyRepository.flagAlreadyExists(
          userId,
          'ANOMALY_SPEED',
          since,
        );

        if (!alreadyFlagged) {
          await this.economyRepository.createFlag(
            userId,
            'ANOMALY_SPEED',
            `Completou ${count} aulas em menos de 3 minutos. Revisão necessária.`,
          );
          this.logger.warn(`[Anti-Fraud] Usuário ${userId} sinalizado — ${count} aulas em <3min`);
        }
      }
    } catch (err) {
      this.logger.error('[Anti-Fraud] Erro na varredura de anomalias', err);
    }
  }
}
