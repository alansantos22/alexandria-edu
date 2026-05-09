import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'user_badges' })
@Unique('UK_USER_BADGE', ['userId', 'badgeId'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_USER_BADGE_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Index('IDX_USER_BADGE_BADGE')
  @Column({ name: 'badge_id', type: 'varchar', length: 36 })
  badgeId: string;

  @CreateDateColumn({ name: 'awarded_at', type: 'timestamp' })
  awardedAt: Date;
}
