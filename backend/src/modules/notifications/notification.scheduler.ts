import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationService } from './notification.service';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationScheduler {
  private readonly logger = new Logger(NotificationScheduler.name);

  constructor(
    private readonly notif: NotificationService,
    @InjectRepository(LiveClass) private readonly liveRepo: Repository<LiveClass>,
    @InjectRepository(Enrollment) private readonly enrRepo: Repository<Enrollment>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendDueReminders() {
    const now = new Date();
    const due = await this.notif.findDuePending(now);
    if (due.length === 0) return;

    for (const item of due) {
      try {
        const lc = await this.liveRepo.findOne({ where: { id: item.liveClassId } });
        if (!lc) {
          await this.notif.markScheduledSent(item.id);
          continue;
        }

        // Buscar alunos matriculados na cohort dessa aula
        const enrollments = await this.enrRepo.find({
          where: { cohortId: lc.cohortId, status: 'active' },
        });
        const userIds = enrollments.map(e => e.userId);
        if (userIds.length === 0) {
          await this.notif.markScheduledSent(item.id);
          continue;
        }

        const users = await this.userRepo.find({ where: { id: In(userIds) } });
        const labels: Record<string, { title: string; body: string }> = {
          reminder_60min: {
            title: `Sua aula começa em 1h: ${lc.title}`,
            body: `A aula "${lc.title}" começa às ${lc.startsAt.toISOString()}.`,
          },
          reminder_15min: {
            title: `Sua aula começa em 15min: ${lc.title}`,
            body: `Prepare-se! A aula "${lc.title}" começa em instantes.`,
          },
          starting: {
            title: `Sua aula começou: ${lc.title}`,
            body: `Entre agora na aula "${lc.title}".`,
          },
          recording_available: {
            title: `Gravação disponível: ${lc.title}`,
            body: `A gravação da aula "${lc.title}" já está disponível.`,
          },
        };
        const meta = labels[item.kind];

        for (const u of users) {
          await this.notif.notify({
            userId: u.id,
            type: `live_class.${item.kind}`,
            title: meta.title,
            body: meta.body,
            link: `/live/${lc.id}`,
            payload: { liveClassId: lc.id, kind: item.kind },
            email: u.email
              ? { to: u.email, subject: meta.title, html: `<p>${meta.body}</p><p><a href="${process.env.FRONTEND_URL || ''}/live/${lc.id}">Entrar na aula</a></p>` }
              : undefined,
          });
        }
        await this.notif.markScheduledSent(item.id);
      } catch (err) {
        this.logger.error(`Erro processando scheduled ${item.id}: ${(err as Error).message}`);
      }
    }
  }
}
