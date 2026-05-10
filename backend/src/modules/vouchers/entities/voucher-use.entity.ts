import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'voucher_uses' })
@Index('uq_vuse_user', ['voucherId', 'userId'], { unique: true })
export class VoucherUse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'voucher_id', type: 'varchar', length: 36 })
  voucherId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @CreateDateColumn({ name: 'used_at', type: 'timestamp' })
  usedAt: Date;
}
