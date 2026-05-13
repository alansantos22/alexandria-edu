import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { LiveClass } from './entities/live-class.entity';
import { LiveClassAttendance } from './entities/live-class-attendance.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { EnrollmentService } from '../enrollments/enrollment.service';
import { NotificationService } from '../notifications/notification.service';

export interface JoinTokenResult {
  joinUrl: string;
  token: string;
  expiresAt: Date;
  provider: string;
}

@Injectable()
export class LiveClassService {
  constructor(
    @InjectRepository(LiveClass) private readonly repo: Repository<LiveClass>,
    @InjectRepository(LiveClassAttendance) private readonly attRepo: Repository<LiveClassAttendance>,
    @InjectRepository(Cohort) private readonly cohortRepo: Repository<Cohort>,
    private readonly jwt: JwtService,
    private readonly enrollments: EnrollmentService,
    private readonly notifications: NotificationService,
  ) {}

  async create(data: Partial<LiveClass>, createdBy: string): Promise<LiveClass> {
    if (!data.cohortId) throw new BadRequestException('cohortId obrigatório');
    if (!data.startsAt) throw new BadRequestException('startsAt obrigatório');

    const lc = this.repo.create({ ...data, createdBy });
    const saved = await this.repo.save(lc);
    await this.notifications.scheduleForLiveClass(saved.id, saved.startsAt);
    return saved;
  }

  async update(id: string, patch: Partial<LiveClass>): Promise<LiveClass> {
    const lc = await this.repo.findOne({ where: { id } });
    if (!lc) throw new NotFoundException('Aula não encontrada');
    const oldStart = lc.startsAt;
    Object.assign(lc, patch);
    const saved = await this.repo.save(lc);
    if (patch.startsAt && patch.startsAt.getTime() !== oldStart.getTime()) {
      await this.notifications.scheduleForLiveClass(saved.id, saved.startsAt);
    }
    return saved;
  }

  async delete(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  /** Lista no intervalo (para calendar) */
  async listInRange(from: Date, to: Date): Promise<LiveClass[]> {
    return this.repo.find({
      where: { startsAt: Between(from, to) },
      order: { startsAt: 'ASC' },
    });
  }

  /** Retorna view pública (sem URL real) */
  toPublicView(lc: LiveClass, hasAccess: boolean) {
    const { externalUrl, ...safe } = lc;
    return {
      ...safe,
      hasAccess,
      locked: !hasAccess,
    };
  }

  /**
   * Gera token assinado para entrar na sala. NUNCA expõe externalUrl ao cliente sem validar.
   * Janela: starts_at - 15min  →  ends_at + 30min
   */
  async generateJoinToken(userId: string, liveClassId: string): Promise<JoinTokenResult> {
    const lc = await this.findById(liveClassId);
    if (!lc) throw new NotFoundException('Aula não encontrada');
    if (lc.status === 'cancelled') throw new BadRequestException('Aula cancelada');

    const cohort = await this.cohortRepo.findOne({ where: { id: lc.cohortId } });
    if (!cohort) throw new NotFoundException('Turma não encontrada');

    // Verifica acesso ativo via product
    const enrollment = await this.enrollments.findActiveForLiveClassCohort(userId, lc.cohortId);
    if (!enrollment) throw new BadRequestException('Você não tem acesso a esta aula.');

    // Verifica janela temporal
    const now = Date.now();
    const start = lc.startsAt.getTime();
    const end = start + lc.durationMin * 60_000;
    const windowOpen = start - 15 * 60_000;
    const windowClose = end + 30 * 60_000;
    if (now < windowOpen) {
      throw new BadRequestException(`Sala abre 15 minutos antes (${new Date(windowOpen).toISOString()}).`);
    }
    if (now > windowClose) {
      throw new BadRequestException('Aula encerrada. Veja a gravação quando disponível.');
    }

    // Registrar attendance (best-effort)
    try {
      const existing = await this.attRepo.findOne({ where: { liveClassId, userId } });
      if (!existing) {
        await this.attRepo.save(this.attRepo.create({ liveClassId, userId }));
      }
    } catch { /* ignore unique violations */ }

    // Consumir quota (se houver) — apenas 1x por aula (já tem unique constraint)
    if (enrollment.lessonsQuota != null) {
      await this.enrollments.consumeLesson(enrollment.id);
    }

    const expiresAt = new Date(windowClose);
    const token = await this.jwt.signAsync(
      {
        sub: userId,
        lc: liveClassId,
        room: lc.roomId ?? liveClassId,
        provider: lc.provider,
        purpose: 'live_class_join',
      },
      { expiresIn: Math.floor((windowClose - now) / 1000), audience: 'live-class', issuer: 'alexandria-edu-api' },
    );

    // joinUrl: nunca passa external_url para clientes não-LiveKit.
    // Para LiveKit: retornaria URL do servidor LiveKit + token. Por enquanto:
    let joinUrl: string;
    if (lc.provider === 'livekit') {
      const wsUrl = process.env.LIVEKIT_URL || '';
      joinUrl = `${wsUrl}?access_token=${token}`;
    } else {
      // Para provider manual / meet / zoom / jitsi: retornamos URL proxy interna.
      // Backend revelará a URL real após validação adicional (não retornamos aqui).
      joinUrl = `/api/v1/live-classes/${liveClassId}/redirect?t=${token}`;
    }

    return { joinUrl, token, expiresAt, provider: lc.provider };
  }

  /** Valida token e retorna external_url real (para provider manual/meet/zoom/jitsi) */
  async resolveRedirect(token: string): Promise<string> {
    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token, { audience: 'live-class', issuer: 'alexandria-edu-api' });
    } catch {
      throw new BadRequestException('Token inválido ou expirado');
    }
    if (payload.purpose !== 'live_class_join') throw new BadRequestException('Token inválido');

    const lc = await this.findById(payload.lc);
    if (!lc) throw new NotFoundException('Aula não encontrada');
    if (!lc.externalUrl) throw new BadRequestException('URL externa não configurada para esta aula.');
    return lc.externalUrl;
  }

  setRecording(id: string, url: string) {
    return this.repo.update(id, { recordingUrl: url, status: 'ended' });
  }
}
