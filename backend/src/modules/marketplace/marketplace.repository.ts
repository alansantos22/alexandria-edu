import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';

import { MarketplaceItem }            from './entities/marketplace-item.entity';
import { MarketplaceSeason }          from './entities/marketplace-season.entity';
import { UserInventory }              from './entities/user-inventory.entity';
import { UserProfileCustomization }   from './entities/user-profile-customization.entity';
import type { ItemType }              from './entities/marketplace-item.entity';

@Injectable()
export class MarketplaceRepository {
  constructor(
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,

    @InjectRepository(MarketplaceSeason)
    private readonly seasonRepo: Repository<MarketplaceSeason>,

    @InjectRepository(UserInventory)
    private readonly inventoryRepo: Repository<UserInventory>,

    @InjectRepository(UserProfileCustomization)
    private readonly profileRepo: Repository<UserProfileCustomization>,
  ) {}

  // ─── Items ─────────────────────────────────────────────────────────────────

  findAllActive(): Promise<MarketplaceItem[]> {
    return this.itemRepo.find({
      where: { isActive: 1 },
      order: { rarity: 'ASC', priceCoins: 'ASC' },
    });
  }

  findItemById(id: string): Promise<MarketplaceItem | null> {
    return this.itemRepo.findOne({ where: { id, isActive: 1 } });
  }

  // ─── Active season ─────────────────────────────────────────────────────────

  findActiveSeason(): Promise<MarketplaceSeason | null> {
    return this.seasonRepo
      .createQueryBuilder('s')
      .where('s.isActive = 1')
      .andWhere('s.endsAt > NOW()')
      .orderBy('s.endsAt', 'ASC')
      .getOne();
  }

  // ─── Inventory ─────────────────────────────────────────────────────────────

  findUserInventory(userId: string): Promise<UserInventory[]> {
    return this.inventoryRepo.find({ where: { userId }, order: { purchasedAt: 'DESC' } });
  }

  async userOwnsItem(userId: string, itemId: string): Promise<boolean> {
    const count = await this.inventoryRepo.count({ where: { userId, itemId } });
    return count > 0;
  }

  addToInventory(userId: string, itemId: string): Promise<UserInventory> {
    const entry = this.inventoryRepo.create({ userId, itemId });
    return this.inventoryRepo.save(entry);
  }

  // ─── Profile customization ─────────────────────────────────────────────────

  async findOrCreateProfile(userId: string): Promise<UserProfileCustomization> {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  async equipItem(userId: string, itemId: string, type: ItemType): Promise<UserProfileCustomization> {
    const profile = await this.findOrCreateProfile(userId);

    const slotMap: Record<ItemType, keyof UserProfileCustomization> = {
      avatar:    'activeAvatarItemId',
      frame:     'activeFrameItemId',
      badge:     'activeBadgeItemId',
      wallpaper: 'activeWallpaperItemId',
      palette:   'activePaletteItemId',
    };

    (profile as any)[slotMap[type]] = itemId;
    return this.profileRepo.save(profile);
  }

  async unequipSlot(userId: string, type: ItemType): Promise<UserProfileCustomization> {
    const profile = await this.findOrCreateProfile(userId);

    const slotMap: Record<ItemType, keyof UserProfileCustomization> = {
      avatar:    'activeAvatarItemId',
      frame:     'activeFrameItemId',
      badge:     'activeBadgeItemId',
      wallpaper: 'activeWallpaperItemId',
      palette:   'activePaletteItemId',
    };

    (profile as any)[slotMap[type]] = null;
    return this.profileRepo.save(profile);
  }

  async updateBio(userId: string, bio: string | null): Promise<UserProfileCustomization> {
    const profile = await this.findOrCreateProfile(userId);
    profile.bio = bio;
    return this.profileRepo.save(profile);
  }

  findProfile(userId: string): Promise<UserProfileCustomization | null> {
    return this.profileRepo.findOne({ where: { userId } });
  }
}
