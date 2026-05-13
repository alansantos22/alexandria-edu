import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Product } from '../commerce/entities/product.entity';

export interface CalendarEvent {
  id: string;
  title: string;
  theme: string | null;
  startsAt: Date;
  durationMin: number;
  endsAt: Date;
  productId: string;
  productSlug: string | null;
  productName: string | null;
  cohortId: string;
  cohortName: string | null;
  status: string;
  /** Tem acesso (matriculado) → false aparece com cadeado */
  hasAccess: boolean;
  /** Tem gravação disponível */
  hasRecording: boolean;
}

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(LiveClass) private readonly liveRepo: Repository<LiveClass>,
    @InjectRepository(Cohort) private readonly cohortRepo: Repository<Cohort>,
    @InjectRepository(Enrollment) private readonly enrRepo: Repository<Enrollment>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
  ) {}

  /** Para aluno: todas as aulas no intervalo, marcando hasAccess se matriculado */
  async listForUser(userId: string, from: Date, to: Date): Promise<CalendarEvent[]> {
    const liveClasses = await this.liveRepo.find({
      where: { startsAt: Between(from, to) },
      order: { startsAt: 'ASC' },
    });
    if (liveClasses.length === 0) return [];

    const cohortIds = Array.from(new Set(liveClasses.map(l => l.cohortId)));
    const cohorts = await this.cohortRepo.find({ where: { id: In(cohortIds) } });
    const cohortMap = new Map(cohorts.map(c => [c.id, c]));
    const productIds = Array.from(new Set(cohorts.map(c => c.productId)));

    const [products, userEnrollments] = await Promise.all([
      this.productRepo.find({ where: { id: In(productIds) } }),
      this.enrRepo.find({ where: { userId, status: 'active', cohortId: In(cohortIds) } }),
    ]);
    const productMap = new Map(products.map(p => [p.id, p]));
    const userCohorts = new Set(userEnrollments.map(e => e.cohortId).filter(Boolean) as string[]);

    return liveClasses.map(l => this.toEvent(l, cohortMap, productMap, userCohorts));
  }

  /** Para admin: todas as aulas + tudo público */
  async listAll(from: Date, to: Date): Promise<CalendarEvent[]> {
    const liveClasses = await this.liveRepo.find({
      where: { startsAt: Between(from, to) },
      order: { startsAt: 'ASC' },
    });
    const cohortIds = Array.from(new Set(liveClasses.map(l => l.cohortId)));
    const cohorts = cohortIds.length
      ? await this.cohortRepo.find({ where: { id: In(cohortIds) } })
      : [];
    const cohortMap = new Map(cohorts.map(c => [c.id, c]));
    const productIds = Array.from(new Set(cohorts.map(c => c.productId)));
    const products = productIds.length
      ? await this.productRepo.find({ where: { id: In(productIds) } })
      : [];
    const productMap = new Map(products.map(p => [p.id, p]));
    return liveClasses.map(l => this.toEvent(l, cohortMap, productMap, new Set(), true));
  }

  private toEvent(
    l: LiveClass,
    cohortMap: Map<string, Cohort>,
    productMap: Map<string, Product>,
    userCohorts: Set<string>,
    isAdmin = false,
  ): CalendarEvent {
    const cohort = cohortMap.get(l.cohortId) || null;
    const product = cohort ? productMap.get(cohort.productId) || null : null;
    return {
      id: l.id,
      title: l.title,
      theme: l.theme,
      startsAt: l.startsAt,
      durationMin: l.durationMin,
      endsAt: new Date(l.startsAt.getTime() + l.durationMin * 60_000),
      productId: cohort?.productId || '',
      productSlug: product?.slug || null,
      productName: product?.name || null,
      cohortId: l.cohortId,
      cohortName: cohort?.name || null,
      status: l.status,
      hasAccess: isAdmin ? true : userCohorts.has(l.cohortId),
      hasRecording: !!l.recordingUrl,
    };
  }
}
