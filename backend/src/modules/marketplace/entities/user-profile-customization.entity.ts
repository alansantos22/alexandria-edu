import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'user_profile_customization' })
export class UserProfileCustomization {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'active_avatar_item_id', type: 'varchar', length: 36, nullable: true })
  activeAvatarItemId: string | null;

  @Column({ name: 'active_frame_item_id', type: 'varchar', length: 36, nullable: true })
  activeFrameItemId: string | null;

  @Column({ name: 'active_badge_item_id', type: 'varchar', length: 36, nullable: true })
  activeBadgeItemId: string | null;

  @Column({ name: 'active_wallpaper_item_id', type: 'varchar', length: 36, nullable: true })
  activeWallpaperItemId: string | null;

  @Column({ name: 'active_palette_item_id', type: 'varchar', length: 36, nullable: true })
  activePaletteItemId: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
