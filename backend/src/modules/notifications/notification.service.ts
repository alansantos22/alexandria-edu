import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { ScheduledNotification, ScheduledNotificationKind } from './entities/scheduled-notification.entity';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  payload?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private mailer: any = null;
  private mailFrom = '';

  constructor(
    @InjectRepository(Notification) private readonly notifRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference) private readonly prefRepo: Repository<NotificationPreference>,
    @InjectRepository(ScheduledNotification) private readonly schedRepo: Repository<ScheduledNotification>,
  ) {
    this.initMailer();
  }

  private async initMailer() {
    if (!process.env.SMTP_HOST) {
      this.logger.warn('SMTP_HOST não configurado — emails ficarão desabilitados.');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const nodemailer = require('nodemailer');
      this.mailer = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
      this.mailFrom = process.env.SMTP_FROM || 'no-reply@alexandria.edu';
    } catch (err) {
      this.logger.error(`Falha ao iniciar nodemailer: ${(err as Error).message}`);
    }
  }

  async getPreference(userId: string): Promise<NotificationPreference> {
    let pref = await this.prefRepo.findOne({ where: { userId } });
    if (!pref) {
      pref = this.prefRepo.create({ userId });
      pref = await this.prefRepo.save(pref);
    }
    return pref;
  }

  async updatePreference(userId: string, patch: Partial<NotificationPreference>) {
    const pref = await this.getPreference(userId);
    Object.assign(pref, patch);
    return this.prefRepo.save(pref);
  }

  async createInApp(input: CreateNotificationInput): Promise<Notification> {
    const n = this.notifRepo.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      payload: input.payload ?? null,
    });
    return this.notifRepo.save(n);
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.mailer) return false;
    try {
      await this.mailer.sendMail({ from: this.mailFrom, to, subject, html });
      return true;
    } catch (err) {
      this.logger.error(`Falha enviando email: ${(err as Error).message}`);
      return false;
    }
  }

  async notify(input: CreateNotificationInput & { email?: { to: string; subject: string; html: string } }) {
    const pref = await this.getPreference(input.userId);
    if (pref.inAppEnabled) await this.createInApp(input);
    if (pref.emailEnabled && input.email) {
      await this.sendEmail(input.email.to, input.email.subject, input.email.html);
    }
  }

  async list(userId: string, limit = 50): Promise<Notification[]> {
    return this.notifRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notifRepo.count({ where: { userId, readAt: IsNull() } });
  }

  async markRead(userId: string, id: string) {
    await this.notifRepo.update({ id, userId }, { readAt: new Date() });
  }

  async markAllRead(userId: string) {
    await this.notifRepo.update({ userId, readAt: IsNull() }, { readAt: new Date() });
  }

  // ── Scheduled ──────────────────────────────────────────────────────────

  async scheduleForLiveClass(liveClassId: string, startsAt: Date) {
    const items: Array<{ kind: ScheduledNotificationKind; offsetMin: number }> = [
      { kind: 'reminder_60min', offsetMin: -60 },
      { kind: 'reminder_15min', offsetMin: -15 },
      { kind: 'starting',       offsetMin: 0   },
    ];
    for (const it of items) {
      const when = new Date(startsAt.getTime() + it.offsetMin * 60_000);
      const existing = await this.schedRepo.findOne({ where: { liveClassId, kind: it.kind } });
      if (existing) {
        existing.scheduledFor = when;
        existing.sentAt = null;
        await this.schedRepo.save(existing);
      } else {
        await this.schedRepo.save(this.schedRepo.create({ liveClassId, kind: it.kind, scheduledFor: when }));
      }
    }
  }

  async findDuePending(now: Date): Promise<ScheduledNotification[]> {
    return this.schedRepo.find({
      where: { scheduledFor: LessThanOrEqual(now), sentAt: IsNull() },
      take: 100,
    });
  }

  async markScheduledSent(id: string) {
    await this.schedRepo.update(id, { sentAt: new Date() });
  }
}
