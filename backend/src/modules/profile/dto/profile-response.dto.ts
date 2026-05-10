import { Rarity } from '../entities/badge.entity';

export interface EquippedItemDto {
  id: string;
  name: string;
  type: string;
  imageUrl: string | null;
  rarity: string;
}

export interface ProfileCustomizationDto {
  bio: string | null;
  wallpaper: EquippedItemDto | null;
  frame:     EquippedItemDto | null;
  badge:     EquippedItemDto | null;
  avatar:    EquippedItemDto | null;
  palette:   EquippedItemDto | null;
}

export interface BadgeDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  rarity: Rarity;
  xpReward: number;
  awardedAt: Date;
}

export interface CardDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  artUrl: string | null;
  rarity: Rarity;
  eventName: string | null;
  quantity: number;
  acquiredAt: Date;
}

export interface ModuleProgressDto {
  id: string;
  name: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
}

export interface TrackProgressDto {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  modules: ModuleProgressDto[];
}

export interface ProfileResponseDto {
  user: {
    username: string;
    level: number;
    xp: number;
    xpInCurrentLevel: number;
    xpPerLevel: number;
    streakDays: number;
    coinsBalance: number;
    memberSince: Date;
    avatarUrl: string;
    isOwnProfile: boolean;
  };
  stats: {
    totalLessons: number;
    completedLessons: number;
    completionRate: number;
  };
  badges: BadgeDto[];
  cards: CardDto[];
  tracks: TrackProgressDto[];
  customization: ProfileCustomizationDto;
}
