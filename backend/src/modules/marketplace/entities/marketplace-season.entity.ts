import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'marketplace_seasons' })
export class MarketplaceSeason {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'starts_at', type: 'datetime' })
  startsAt: Date;

  @Index('IDX_MKT_SEASON_ACTIVE')
  @Column({ name: 'ends_at', type: 'datetime' })
  endsAt: Date;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  isActive: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
