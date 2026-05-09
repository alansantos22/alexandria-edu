import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { User } from '../users/entities/user.entity';

const XP_PER_LESSON = 50;
const XP_PER_LEVEL  = 500;

@Injectable()
export class ProgressRepository {
  constructor(
    @InjectRepository(UserLessonProgress)
    private readonly progressRepo: Repository<UserLessonProgress>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findCompletedByUser(userId: string): Promise<UserLessonProgress[]> {
    return this.progressRepo.find({ where: { userId } });
  }

  async isCompleted(userId: string, lessonId: string): Promise<boolean> {
    const count = await this.progressRepo.count({ where: { userId, lessonId } });
    return count > 0;
  }

  async markCompleted(userId: string, lessonId: string): Promise<UserLessonProgress> {
    const record = this.progressRepo.create({ userId, lessonId });
    try {
      return await this.progressRepo.save(record);
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'ER_DUP_ENTRY') throw new ConflictException('Aula já concluída');
      throw err;
    }
  }

  async getUserStats(userId: string): Promise<{ xp: number; level: number; streakDays: number }> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['xp', 'level', 'streakDays'],
    });
    return { xp: user?.xp ?? 0, level: user?.level ?? 1, streakDays: user?.streakDays ?? 0 };
  }

  async awardXpAndUpdateStreak(userId: string): Promise<{ xp: number; level: number; streakDays: number }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Streak calculation (server-side, timezone-agnostic via UTC day diff)
    const now = new Date();
    const lastActivity = user.lastActivityAt;
    let newStreak = user.streakDays ?? 0;

    if (!lastActivity) {
      newStreak = 1;
    } else {
      const nowDay  = Math.floor(now.getTime()          / 86_400_000);
      const lastDay = Math.floor(lastActivity.getTime() / 86_400_000);
      const diff    = nowDay - lastDay;

      if (diff === 0) {
        // Same calendar day — keep streak unchanged
      } else if (diff === 1) {
        newStreak = (user.streakDays ?? 0) + 1;
      } else {
        newStreak = 1; // Broke the streak
      }
    }

    const newXp    = (user.xp ?? 0) + XP_PER_LESSON;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

    await this.userRepo.update(userId, {
      xp: newXp,
      level: newLevel,
      streakDays: newStreak,
      lastActivityAt: now,
    });

    return { xp: newXp, level: newLevel, streakDays: newStreak };
  }
}
