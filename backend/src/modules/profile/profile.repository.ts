import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { Card } from './entities/card.entity';
import { UserCard } from './entities/user-card.entity';
import { Track } from './entities/track.entity';
import { LearningModule } from './entities/learning-module.entity';
import { Lesson } from '@/modules/lessons/entities/lesson.entity';
import { UserLessonProgress } from '@/modules/lessons/entities/user-lesson-progress.entity';
import { BadgeDto, CardDto, TrackProgressDto } from './dto/profile-response.dto';

@Injectable()
export class ProfileRepository {
  constructor(
    @InjectRepository(Badge)               private readonly badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge)           private readonly userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(Card)                private readonly cardRepo: Repository<Card>,
    @InjectRepository(UserCard)            private readonly userCardRepo: Repository<UserCard>,
    @InjectRepository(Track)               private readonly trackRepo: Repository<Track>,
    @InjectRepository(LearningModule)      private readonly moduleRepo: Repository<LearningModule>,
    @InjectRepository(Lesson)              private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(UserLessonProgress)  private readonly progressRepo: Repository<UserLessonProgress>,
  ) {}

  async getUserBadges(userId: string): Promise<BadgeDto[]> {
    const userBadges = await this.userBadgeRepo.find({
      where: { userId },
      order: { awardedAt: 'DESC' },
    });
    if (!userBadges.length) return [];

    const badgeIds = userBadges.map(ub => ub.badgeId);
    const badges   = await this.badgeRepo.findBy({ id: In(badgeIds) });

    return badges.map(b => {
      const ub = userBadges.find(u => u.badgeId === b.id)!;
      return { ...b, awardedAt: ub.awardedAt };
    });
  }

  async getUserCards(userId: string): Promise<CardDto[]> {
    const userCards = await this.userCardRepo.find({
      where: { userId },
      order: { acquiredAt: 'DESC' },
    });
    if (!userCards.length) return [];

    const cardIds = userCards.map(uc => uc.cardId);
    const cards   = await this.cardRepo.findBy({ id: In(cardIds) });

    return cards.map(c => {
      const uc = userCards.find(u => u.cardId === c.id)!;
      return { ...c, quantity: uc.quantity, acquiredAt: uc.acquiredAt };
    });
  }

  async getTracksWithProgress(userId: string): Promise<TrackProgressDto[]> {
    const tracks = await this.trackRepo.find({
      where: { isActive: true },
      order: { orderIndex: 'ASC' },
    });
    if (!tracks.length) return [];

    // Batch load: todos os módulos das trilhas ativas
    const trackIds  = tracks.map(t => t.id);
    const allModules = await this.moduleRepo.find({
      where: { trackId: In(trackIds) },
      order: { orderIndex: 'ASC' },
    });

    // Batch load: todas as aulas publicadas dos módulos encontrados
    const moduleIds  = allModules.map(m => m.id);
    const allLessons = moduleIds.length
      ? await this.lessonRepo
          .createQueryBuilder('l')
          .where('l.module_id IN (:...ids)', { ids: moduleIds })
          .andWhere('l.is_published = :pub', { pub: true })
          .getMany()
      : [];

    // Batch load: aulas concluídas pelo usuário nesse conjunto
    const lessonIds = allLessons.map(l => l.id);
    const completedSet = new Set<string>(
      lessonIds.length
        ? (await this.progressRepo.findBy({ userId, lessonId: In(lessonIds) })).map(p => p.lessonId)
        : [],
    );

    return tracks.map(track => {
      const mods = allModules.filter(m => m.trackId === track.id);

      const modulesDto = mods.map(mod => {
        const lessons        = allLessons.filter(l => (l as any).moduleId === mod.id);
        const completedCount = lessons.filter(l => completedSet.has(l.id)).length;
        return {
          id:               mod.id,
          name:             mod.name,
          totalLessons:     lessons.length,
          completedLessons: completedCount,
          progress:         lessons.length > 0
            ? Math.round((completedCount / lessons.length) * 100)
            : 0,
        };
      });

      const totalLessons     = modulesDto.reduce((s, m) => s + m.totalLessons, 0);
      const completedLessons = modulesDto.reduce((s, m) => s + m.completedLessons, 0);

      return {
        id:               track.id,
        name:             track.name,
        icon:             track.icon,
        description:      track.description,
        totalLessons,
        completedLessons,
        progress:         totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0,
        modules: modulesDto,
      };
    });
  }

  async getLessonStats(userId: string): Promise<{ totalLessons: number; completedLessons: number }> {
    const [totalLessons, completedLessons] = await Promise.all([
      this.lessonRepo.countBy({ isPublished: true }),
      this.progressRepo.countBy({ userId }),
    ]);
    return { totalLessons, completedLessons };
  }
}
