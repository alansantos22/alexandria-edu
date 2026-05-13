import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort, CohortStatus } from './entities/cohort.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';

export interface CohortWithSeats extends Cohort {
  enrolledCount: number;
  seatsLeft: number | null;
  isFull: boolean;
}

@Injectable()
export class CohortService {
  constructor(
    @InjectRepository(Cohort) private readonly repo: Repository<Cohort>,
    @InjectRepository(Enrollment) private readonly enrRepo: Repository<Enrollment>,
  ) {}

  async create(data: Partial<Cohort>): Promise<Cohort> {
    if (!data.productId) throw new BadRequestException('productId obrigatório');
    const cohort = this.repo.create(data);
    return this.repo.save(cohort);
  }

  async update(id: string, patch: Partial<Cohort>): Promise<Cohort> {
    const cohort = await this.repo.findOne({ where: { id } });
    if (!cohort) throw new NotFoundException('Turma não encontrada');
    Object.assign(cohort, patch);
    return this.repo.save(cohort);
  }

  async delete(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async listByProduct(productId: string): Promise<CohortWithSeats[]> {
    const cohorts = await this.repo.find({
      where: { productId },
      order: { startsAt: 'ASC' },
    });
    return Promise.all(cohorts.map(c => this.withSeats(c)));
  }

  async withSeats(cohort: Cohort): Promise<CohortWithSeats> {
    const enrolledCount = await this.enrRepo.count({
      where: { cohortId: cohort.id, status: 'active' },
    });
    const seatsLeft = cohort.capacity == null ? null : Math.max(0, cohort.capacity - enrolledCount);
    return {
      ...cohort,
      enrolledCount,
      seatsLeft,
      isFull: seatsLeft != null && seatsLeft <= 0,
    };
  }

  async assertAvailable(cohortId: string): Promise<Cohort> {
    const cohort = await this.findById(cohortId);
    if (!cohort) throw new NotFoundException('Turma não encontrada');
    const closedStatuses: CohortStatus[] = ['closed', 'finished', 'cancelled'];
    if (closedStatuses.includes(cohort.status)) {
      throw new BadRequestException('Turma não está aberta para matrículas.');
    }
    const enrolled = await this.enrRepo.count({ where: { cohortId, status: 'active' } });
    if (cohort.capacity != null && enrolled >= cohort.capacity) {
      throw new BadRequestException('Turma lotada.');
    }
    return cohort;
  }
}
