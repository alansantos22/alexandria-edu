import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ItemType = 'avatar' | 'wallpaper' | 'badge' | 'frame';
export type Rarity   = 'common' | 'rare' | 'epic' | 'legendary';

@Entity({ name: 'marketplace_items' })
export class MarketplaceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('IDX_MKT_ITEM_TYPE')
  @Column({ type: 'enum', enum: ['avatar', 'wallpaper', 'badge', 'frame'] })
  type: ItemType;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'preview_url', type: 'varchar', length: 500, nullable: true })
  previewUrl: string | null;

  @Column({ name: 'price_coins', type: 'int', default: 0 })
  priceCoins: number;

  @Index('IDX_MKT_ITEM_RARITY')
  @Column({ type: 'enum', enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' })
  rarity: Rarity;

  @Index('IDX_MKT_ITEM_ACTIVE')
  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @Column({ name: 'season_id', type: 'varchar', length: 36, nullable: true })
  seasonId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
