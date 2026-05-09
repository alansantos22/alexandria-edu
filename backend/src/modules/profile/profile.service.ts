import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '@/modules/users/users.repository';
import { ProfileRepository } from './profile.repository';
import { ProfileResponseDto } from './dto/profile-response.dto';

@Injectable()
export class ProfileService {
  /** XP necessário para avançar um nível — deve coincidir com progress.repository.ts */
  private static readonly XP_PER_LEVEL = 500;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async getPublicProfile(username: string, requesterId: string): Promise<ProfileResponseDto> {
    const user = await this.usersRepository.findByUsername(username);

    if (!user || (!user.isActive && user.role !== 'admin')) {
      throw new NotFoundException('Perfil não encontrado');
    }

    const [badges, cards, tracks, lessonStats, customization] = await Promise.all([
      this.profileRepository.getUserBadges(user.id),
      this.profileRepository.getUserCards(user.id),
      this.profileRepository.getTracksWithProgress(user.id),
      this.profileRepository.getLessonStats(user.id),
      this.profileRepository.getCustomizationWithItems(user.id),
    ]);

    const xpInCurrentLevel = user.xp % ProfileService.XP_PER_LEVEL;
    const completionRate   = lessonStats.totalLessons > 0
      ? Math.round((lessonStats.completedLessons / lessonStats.totalLessons) * 100)
      : 0;

    return {
      user: {
        username:         user.username,
        level:            user.level,
        xp:               user.xp,
        xpInCurrentLevel,
        xpPerLevel:       ProfileService.XP_PER_LEVEL,
        streakDays:       user.streakDays,
        coinsBalance:     user.coinsBalance,
        memberSince:      user.createdAt,
        avatarUrl:        customization.avatar?.imageUrl
                            ?? `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.username)}`,
        isOwnProfile:     user.id === requesterId,
      },
      stats: {
        totalLessons:     lessonStats.totalLessons,
        completedLessons: lessonStats.completedLessons,
        completionRate,
      },
      badges,
      cards,
      tracks,
      customization,
    };
  }

  async updateBio(userId: string, bio: string | null): Promise<{ bio: string | null }> {
    await this.profileRepository.updateBio(userId, bio);
    return { bio };
  }
}
