import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment, EnrollmentSource } from './entities/enrollment.entity';
import { Product } from '../commerce/entities/product.entity';

export interface GrantEnrollmentInput {
  userId: string;
  productId: string;
  cohortId?: string | null;
  source: EnrollmentSource;
  sourceRef?: string;
  /** override product.access_duration_days */
  accessDurationDays?: number;
  /** override product.lessons_quota */
  lessonsQuota?: number | null;
}

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectRepository(Enrollment) private readonly repo: Repository<Enrollment>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  async grant(input: GrantEnrollmentInput): Promise<Enrollment> {
    const product = await this.productRepo.findOne({ where: { id: input.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const existing = await this.repo.findOne({
      where: { userId: input.userId, productId: input.productId },
    });
    if (existing && existing.status === 'active') {
      // Refresh expires_at se a nova janela for maior
      const days = input.accessDurationDays ?? product.accessDurationDays;
      const newExp = new Date(Date.now() + days * 24 * 3600 * 1000);
      if (!existing.expiresAt || existing.expiresAt < newExp) {
        existing.expiresAt = newExp;
        existing.cohortId = input.cohortId ?? existing.cohortId;
        return this.repo.save(existing);
      }
      return existing;
    }

    const days = input.accessDurationDays ?? product.accessDurationDays;
    const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);
    const quota = input.lessonsQuota !== undefined ? input.lessonsQuota : product.lessonsQuota;

    const enrollment = this.repo.create({
      userId: input.userId,
      productId: input.productId,
      cohortId: input.cohortId ?? null,
      source: input.source,
      sourceRef: input.sourceRef ?? null,
      expiresAt,
      lessonsQuota: quota,
      lessonsConsumed: 0,
      status: 'active',
    });
    return this.repo.save(enrollment);
  }

  async listForUser(userId: string): Promise<Enrollment[]> {
    return this.repo.find({ where: { userId }, order: { grantedAt: 'DESC' } });
  }

  async hasActiveAccess(userId: string, productId: string): Promise<boolean> {
    const e = await this.repo.findOne({
      where: { userId, productId, status: 'active' },
    });
    if (!e) return false;
    if (e.expiresAt && e.expiresAt < new Date()) {
      await this.repo.update(e.id, { status: 'expired' });
      return false;
    }
    if (e.lessonsQuota != null && e.lessonsConsumed >= e.lessonsQuota) {
      return false;
    }
    return true;
  }

  /** Retorna a enrollment ativa do usuário para a aula via cohort/product */
  async findActiveForLiveClassCohort(userId: string, cohortId: string): Promise<Enrollment | null> {
    const e = await this.repo.findOne({
      where: { userId, cohortId, status: 'active' },
    });
    if (!e) return null;
    if (e.expiresAt && e.expiresAt < new Date()) {
      await this.repo.update(e.id, { status: 'expired' });
      return null;
    }
    return e;
  }

  async consumeLesson(enrollmentId: string): Promise<void> {
    await this.repo.increment({ id: enrollmentId }, 'lessonsConsumed', 1);
  }

  async cancel(enrollmentId: string): Promise<void> {
    await this.repo.update(enrollmentId, { status: 'cancelled' });
  }
}
