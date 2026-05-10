import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EconomyService }       from '../economy/economy.service';
import { MarketplaceRepository } from './marketplace.repository';
import { MarketplaceItem }       from './entities/marketplace-item.entity';
import { MarketplaceSeason }     from './entities/marketplace-season.entity';
import { UserInventory }         from './entities/user-inventory.entity';
import { UserProfileCustomization } from './entities/user-profile-customization.entity';
import { RedemptionToken }       from './entities/redemption-token.entity';
import type { ItemType }         from './entities/marketplace-item.entity';
import { CityPaletteItem }       from '../city/entities/city-palette-item.entity';

export interface ItemWithOwnership extends MarketplaceItem {
  owned: boolean;
  canAfford: boolean;
}

export interface MarketplaceListResult {
  items: ItemWithOwnership[];
  activeSeason: MarketplaceSeason | null;
  userBalance: number;
}

export interface BuildingWithOwnership extends CityPaletteItem {
  type: 'building';
  owned: boolean;
  canAfford: boolean;
  rarity: 'common';
}

export interface BuildingsListResult {
  buildings: BuildingWithOwnership[];
  userBalance: number;
}

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private readonly marketplaceRepo: MarketplaceRepository,
    private readonly economyService:  EconomyService,
  ) {}

  async listItems(userId: string): Promise<MarketplaceListResult> {
    const [items, activeSeason, { balance }] = await Promise.all([
      this.marketplaceRepo.findAllActive(),
      this.marketplaceRepo.findActiveSeason(),
      this.economyService.getBalance(userId),
    ]);

    const inventory = await this.marketplaceRepo.findUserInventory(userId);
    const ownedSet  = new Set(inventory.map(i => i.itemId));

    const enriched: ItemWithOwnership[] = items.map(item => ({
      ...item,
      owned:     ownedSet.has(item.id),
      canAfford: balance >= item.priceCoins,
    }));

    return { items: enriched, activeSeason, userBalance: balance };
  }

  async purchaseItem(
    userId: string,
    itemId: string,
  ): Promise<{ success: boolean; item: MarketplaceItem; newBalance: number }> {
    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundException('Item não encontrado.');

    const alreadyOwns = await this.marketplaceRepo.userOwnsItem(userId, itemId);
    if (alreadyOwns) throw new BadRequestException('Você já possui este item.');

    if (item.priceCoins > 0) {
      const { success, balance } = await this.economyService.spendCoins(
        userId,
        item.priceCoins,
        itemId,
        `Compra: ${item.name}`,
      );
      if (!success) {
        throw new BadRequestException('Saldo de moedas insuficiente.');
      }
      await this.marketplaceRepo.addToInventory(userId, itemId);
      this.logger.log(`User ${userId} purchased item ${itemId} for ${item.priceCoins} coins`);
      return { success: true, item, newBalance: balance };
    }

    // Itens gratuitos (priceCoins = 0) — apenas adicionar ao inventário
    await this.marketplaceRepo.addToInventory(userId, itemId);
    const { balance } = await this.economyService.getBalance(userId);
    return { success: true, item, newBalance: balance };
  }

  async getUserInventory(
    userId: string,
  ): Promise<{ inventory: UserInventory[]; items: MarketplaceItem[]; profile: UserProfileCustomization | null }> {
    const inventory = await this.marketplaceRepo.findUserInventory(userId);

    // Buscar detalhes de cada item
    const itemDetails = await Promise.all(
      inventory.map(inv => this.marketplaceRepo.findItemById(inv.itemId)),
    );
    const items = itemDetails.filter(Boolean) as MarketplaceItem[];

    const profile = await this.marketplaceRepo.findProfile(userId);
    return { inventory, items, profile };
  }

  async equipItem(
    userId: string,
    itemId: string | null,
    type?: 'avatar' | 'wallpaper' | 'badge' | 'frame' | 'palette',
  ): Promise<UserProfileCustomization> {
    // null = desequipar o slot
    if (itemId === null || itemId === undefined) {
      if (!type) throw new BadRequestException('Informe o tipo do slot para desequipar.');
      const profile = await this.marketplaceRepo.unequipSlot(userId, type as any);
      this.logger.log(`User ${userId} unequipped slot ${type}`);
      return profile;
    }

    const owns = await this.marketplaceRepo.userOwnsItem(userId, itemId);
    if (!owns) throw new BadRequestException('Você não possui este item no inventário.');

    const item = await this.marketplaceRepo.findItemById(itemId);
    if (!item) throw new NotFoundException('Item não encontrado.');

    const profile = await this.marketplaceRepo.equipItem(userId, itemId, item.type as ItemType);
    this.logger.log(`User ${userId} equipped item ${itemId} (${item.type})`);
    return profile;
  }

  async getPublicProfile(userId: string): Promise<{
    profile: UserProfileCustomization | null;
    equippedItems: Partial<Record<ItemType, MarketplaceItem>>;
  }> {
    const profile = await this.marketplaceRepo.findProfile(userId);
    if (!profile) return { profile: null, equippedItems: {} };

    const slotMap: Record<string, ItemType> = {
      activeAvatarItemId:    'avatar',
      activeFrameItemId:     'frame',
      activeBadgeItemId:     'badge',
      activeWallpaperItemId: 'wallpaper',
      activePaletteItemId:   'palette',
    };

    const equippedItems: Partial<Record<ItemType, MarketplaceItem>> = {};

    await Promise.all(
      Object.entries(slotMap).map(async ([field, type]) => {
        const itemId = (profile as any)[field] as string | null;
        if (itemId) {
          const item = await this.marketplaceRepo.findItemById(itemId);
          if (item) equippedItems[type] = item;
        }
      }),
    );

    return { profile, equippedItems };
  }

  // ─── Vault (admin) ─────────────────────────────────────────────────────────

  listAllItems(): Promise<MarketplaceItem[]> {
    return this.marketplaceRepo.findAllItems();
  }

  async toggleVault(itemId: string): Promise<MarketplaceItem> {
    const item = await this.marketplaceRepo.findItemByIdAdmin(itemId);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return this.marketplaceRepo.toggleVault(itemId);
  }

  // ─── Redemption Tokens ─────────────────────────────────────────────────────

  async generateToken(
    itemId: string,
    maxUses: number,
    expiresAt: Date | null,
    createdBy: string,
  ): Promise<RedemptionToken> {
    const item = await this.marketplaceRepo.findItemByIdAdmin(itemId);
    if (!item) throw new NotFoundException('Item não encontrado.');
    return this.marketplaceRepo.createToken(itemId, maxUses, expiresAt, createdBy);
  }

  listTokens(itemId?: string): Promise<RedemptionToken[]> {
    return this.marketplaceRepo.listTokens(itemId);
  }

  /** Usuário resgata um token → item adicionado ao inventário */
  async redeemToken(
    userId: string,
    code: string,
  ): Promise<{ item: MarketplaceItem; message: string }> {
    const token = await this.marketplaceRepo.findTokenByCode(code);
    if (!token) throw new NotFoundException('Código inválido.');

    if (token.currentUses >= token.maxUses) {
      throw new BadRequestException('Este código já atingiu o limite máximo de usos.');
    }

    if (token.expiresAt && token.expiresAt < new Date()) {
      throw new BadRequestException('Este código de resgate expirou.');
    }

    const alreadyOwns = await this.marketplaceRepo.userOwnsItem(userId, token.itemId);
    if (alreadyOwns) throw new BadRequestException('Você já possui este item.');

    await Promise.all([
      this.marketplaceRepo.addToInventory(userId, token.itemId),
      this.marketplaceRepo.incrementTokenUse(token.id),
    ]);

    this.logger.log(`User ${userId} redeemed token ${token.code} → item ${token.itemId}`);
    return { item: token.item, message: 'Item resgatado com sucesso!' };
  }

  // ── Buildings ─────────────────────────────────────────────────────────────

  async listBuildings(userId: string): Promise<BuildingsListResult> {
    const [buildings, unlocks, { balance }] = await Promise.all([
      this.marketplaceRepo.findActivePaletteItems(),
      this.marketplaceRepo.findUserBuildingUnlocks(userId),
      this.economyService.getBalance(userId),
    ]);

    const unlockedSet = new Set(unlocks.map(u => u.paletteItemId));

    const enriched: BuildingWithOwnership[] = buildings.map(b => ({
      ...b,
      type:      'building' as const,
      rarity:    'common' as const,
      owned:     b.priceCoins === 0 || unlockedSet.has(b.id),
      canAfford: balance >= b.priceCoins,
    }));

    return { buildings: enriched, userBalance: balance };
  }

  async purchaseBuilding(
    userId: string,
    paletteItemId: string,
  ): Promise<{ success: boolean; building: CityPaletteItem; newBalance: number }> {
    const building = await this.marketplaceRepo.findPaletteItemById(paletteItemId);
    if (!building) throw new NotFoundException('Edifício não encontrado.');

    if (building.priceCoins === 0) {
      throw new BadRequestException('Este edifício é gratuito e não precisa ser comprado.');
    }

    const alreadyOwns = await this.marketplaceRepo.userOwnsBuilding(userId, paletteItemId);
    if (alreadyOwns) throw new BadRequestException('Você já possui este edifício.');

    const { balance } = await this.economyService.getBalance(userId);
    if (balance < building.priceCoins) {
      throw new BadRequestException(
        `Saldo insuficiente. Necessário: ${building.priceCoins}. Disponível: ${balance}.`,
      );
    }

    const { success, balance: newBalance } = await this.economyService.spendCoins(
      userId,
      building.priceCoins,
      paletteItemId,
      `Compra de edifício: ${building.name}`,
    );
    if (!success) throw new BadRequestException('Saldo de moedas insuficiente.');

    await this.marketplaceRepo.addBuildingUnlock(userId, paletteItemId);
    this.logger.log(`User ${userId} purchased building ${paletteItemId} for ${building.priceCoins} coins`);
    return { success: true, building, newBalance };
  }
}
