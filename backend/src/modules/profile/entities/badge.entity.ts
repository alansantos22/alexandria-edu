import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

@Entity({ name: 'badges' })
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('UK_BADGES_CODE', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, default: '🏅' })
  icon: string;

  @Index('IDX_BADGES_RARITY')
  @Column({ type: 'enum', enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' })
  rarity: Rarity;

  @Column({ name: 'xp_reward', type: 'int', default: 0 })
  xpReward: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
