import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type VoucherKind = 'access' | 'discount';
export type VoucherScope = 'global' | 'product' | 'cohort' | 'live_class';
export type VoucherDiscountKind = 'percent' | 'fixed';

@Entity({ name: 'vouchers' })
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_VOUCHER_CODE')
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  label: string | null;

  @Index('IDX_VOUCHER_KIND')
  @Column({ type: 'enum', enum: ['access', 'discount'], default: 'access' })
  kind: VoucherKind;

  @Column({
    type: 'enum',
    enum: ['global', 'product', 'cohort', 'live_class'],
    default: 'global',
  })
  scope: VoucherScope;

  @Column({ name: 'scope_id', type: 'varchar', length: 36, nullable: true })
  scopeId: string | null;

  @Column({ name: 'discount_kind', type: 'enum', enum: ['percent', 'fixed'], nullable: true })
  discountKind: VoucherDiscountKind | null;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: string;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: string;

  @Column({ name: 'max_uses', type: 'int', default: 1 })
  maxUses: number;

  @Column({ name: 'current_uses', type: 'int', default: 0 })
  currentUses: number;

  @Column({ name: 'access_days', type: 'int', default: 30 })
  accessDays: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
