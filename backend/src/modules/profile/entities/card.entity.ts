import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rarity } from './badge.entity';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('UK_CARDS_CODE', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string | null;

  @Column({ name: 'art_url', type: 'varchar', length: 500, nullable: true })
  artUrl: string | null;

  @Index('IDX_CARDS_RARITY')
  @Column({ type: 'enum', enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' })
  rarity: Rarity;

  @Column({ name: 'event_name', type: 'varchar', length: 255, nullable: true })
  eventName: string | null;

  @Column({ name: 'dropped_at', type: 'timestamp', nullable: true })
  droppedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
