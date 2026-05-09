import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonsRepository } from './lessons.repository';
import { ProgressRepository } from './progress.repository';
import { Lesson } from './entities/lesson.entity';
import { EconomyService } from '../economy/economy.service';

@Injectable()
export class LessonsService {
  constructor(
    private readonly lessonsRepository: LessonsRepository,
    private readonly progressRepository: ProgressRepository,
    private readonly economyService: EconomyService,
  ) {}

  async listForStudent(): Promise<Lesson[]> {
    return this.lessonsRepository.findAllPublished();
  }

  async listAll(): Promise<Lesson[]> {
    return this.lessonsRepository.findAll();
  }

  async getById(id: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) throw new NotFoundException('Aula não encontrada');
    return lesson;
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    return this.lessonsRepository.create(data);
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson> {
    await this.getById(id);
    return this.lessonsRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.lessonsRepository.delete(id);
  }

  async completeLesson(
    userId: string,
    lessonId: string,
  ): Promise<{ alreadyCompleted: boolean; xpEarned: number; xp: number; level: number; streakDays: number; coinsEarned: number; coinsBalance: number }> {
    await this.getById(lessonId);

    const alreadyCompleted = await this.progressRepository.isCompleted(userId, lessonId);
    if (alreadyCompleted) {
      const stats = await this.progressRepository.getUserStats(userId);
      const { balance } = await this.economyService.getBalance(userId);
      return { alreadyCompleted: true, xpEarned: 0, coinsEarned: 0, coinsBalance: balance, ...stats };
    }

    await this.progressRepository.markCompleted(userId, lessonId);
    const [stats, coinTx] = await Promise.all([
      this.progressRepository.awardXpAndUpdateStreak(userId),
      this.economyService.awardCoins(userId, 'LESSON_COMPLETE', lessonId),
    ]);
    const { balance } = await this.economyService.getBalance(userId);
    return { alreadyCompleted: false, xpEarned: 50, coinsEarned: coinTx?.delta ?? 0, coinsBalance: balance, ...stats };
  }

  async getProgress(userId: string): Promise<{
    lessons: Array<{ id: string; title: string; orderIndex: number; completed: boolean }>;
    completedCount: number;
    totalCount: number;
    percentComplete: number;
    xp: number;
    level: number;
    streakDays: number;
  }> {
    const [lessons, completed, stats] = await Promise.all([
      this.lessonsRepository.findAllPublished(),
      this.progressRepository.findCompletedByUser(userId),
      this.progressRepository.getUserStats(userId),
    ]);

    const completedIds = new Set(completed.map((c) => c.lessonId));
    const lessonsWithStatus = lessons.map((l) => ({
      id: l.id,
      title: l.title,
      orderIndex: l.orderIndex,
      completed: completedIds.has(l.id),
    }));

    const completedCount  = completedIds.size;
    const totalCount      = lessons.length;
    const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { lessons: lessonsWithStatus, completedCount, totalCount, percentComplete, ...stats };
  }
}
