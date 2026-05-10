import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';

import { MarketplaceItem }            from './entities/marketplace-item.entity';
import { MarketplaceSeason }          from './entities/marketplace-season.entity';
import { UserInventory }              from './entities/user-inventory.entity';
import { UserProfileCustomization }   from './entities/user-profile-customization.entity';
import { RedemptionToken }            from './entities/redemption-token.entity';
import type { ItemType }              from './entities/marketplace-item.entity';
import { CityPaletteItem }            from '../city/entities/city-palette-item.entity';
import { UserBuildingUnlock }         from '../city/entities/user-building-unlock.entity';

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

    @InjectRepository(RedemptionToken)
    private readonly tokenRepo: Repository<RedemptionToken>,

    @InjectRepository(CityPaletteItem)
    private readonly paletteRepo: Repository<CityPaletteItem>,

    @InjectRepository(UserBuildingUnlock)
    private readonly buildingUnlockRepo: Repository<UserBuildingUnlock>,
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

  // ─── Buildings (city_palette) ────────────────────────────────────────────────────

  findActivePaletteItems(): Promise<CityPaletteItem[]> {
    return this.paletteRepo.find({
      where: { isActive: true as any },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  findPaletteItemById(id: string): Promise<CityPaletteItem | null> {
    return this.paletteRepo.findOne({ where: { id, isActive: true as any } });
  }

  findUserBuildingUnlocks(userId: string): Promise<UserBuildingUnlock[]> {
    return this.buildingUnlockRepo.find({ where: { userId } });
  }

  async userOwnsBuilding(userId: string, paletteItemId: string): Promise<boolean> {
    const count = await this.buildingUnlockRepo.count({ where: { userId, paletteItemId } });
    return count > 0;
  }

  addBuildingUnlock(userId: string, paletteItemId: string): Promise<UserBuildingUnlock> {
    const record = this.buildingUnlockRepo.create({ userId, paletteItemId });
    return this.buildingUnlockRepo.save(record);
  }

  // ─── Vault ─────────────────────────────────────────────────────────────────

  findAllItems(): Promise<MarketplaceItem[]> {
    return this.itemRepo.find({ order: { isVault: 'ASC', rarity: 'ASC', priceCoins: 'ASC' } });
  }

  findItemByIdAdmin(id: string): Promise<MarketplaceItem | null> {
    return this.itemRepo.findOne({ where: { id } });
  }

  async toggleVault(id: string): Promise<MarketplaceItem> {
    const item = await this.itemRepo.findOneOrFail({ where: { id } });
    item.isVault   = item.isVault   ? 0 : 1;
    item.isActive  = item.isVault   ? 0 : item.isActive; // vault → oculto
    return this.itemRepo.save(item);
  }

  // ─── Redemption Tokens ─────────────────────────────────────────────────────

  /** Gera código único de 10 chars uppercase alfanumérico */
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async createToken(
    itemId: string,
    maxUses: number,
    expiresAt: Date | null,
    createdBy: string,
  ): Promise<RedemptionToken> {
    let code: string;
    let tries = 0;
    // garante unicidade em caso raro de colisão
    do {
      code = this.generateCode();
      tries++;
    } while (tries < 10 && await this.tokenRepo.count({ where: { code } }) > 0);

    const token = this.tokenRepo.create({ code, itemId, maxUses, expiresAt, createdBy });
    return this.tokenRepo.save(token);
  }

  listTokens(itemId?: string): Promise<RedemptionToken[]> {
    const where: any = {};
    if (itemId) where.itemId = itemId;
    return this.tokenRepo.find({
      where,
      relations: ['item'],
      order: { createdAt: 'DESC' },
    });
  }

  findTokenByCode(code: string): Promise<RedemptionToken | null> {
    return this.tokenRepo.findOne({ where: { code: code.toUpperCase() }, relations: ['item'] });
  }

  async incrementTokenUse(id: string): Promise<void> {
    await this.tokenRepo.increment({ id }, 'currentUses', 1);
  }
}
