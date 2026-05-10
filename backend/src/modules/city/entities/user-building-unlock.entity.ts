import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'user_building_unlocks' })
export class UserBuildingUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_ubu_user')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Index('idx_ubu_item')
  @Column({ name: 'palette_item_id', type: 'varchar', length: 36 })
  paletteItemId: string;

  @CreateDateColumn({ name: 'unlocked_at', type: 'timestamp' })
  unlockedAt: Date;
}
