import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'user_inventory' })
export class UserInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_INV_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'item_id', type: 'varchar', length: 36 })
  itemId: string;

  @CreateDateColumn({ name: 'purchased_at', type: 'timestamp' })
  purchasedAt: Date;
}
