import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MarketplaceItem } from './marketplace-item.entity';

@Entity({ name: 'redemption_tokens' })
export class RedemptionToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_RTOKEN_CODE')
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ name: 'item_id', type: 'char', length: 36 })
  itemId: string;

  @ManyToOne(() => MarketplaceItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'item_id' })
  item: MarketplaceItem;

  @Column({ name: 'max_uses', type: 'int', default: 1 })
  maxUses: number;

  @Column({ name: 'current_uses', type: 'int', default: 0 })
  currentUses: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
