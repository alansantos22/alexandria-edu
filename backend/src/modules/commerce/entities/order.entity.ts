import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type OrderStatus =
  | 'pending' | 'awaiting_payment' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type PaymentMethod = 'stripe' | 'coins_only' | 'free' | 'admin';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_ORD_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @Column({ name: 'cohort_id', type: 'varchar', length: 36, nullable: true })
  cohortId: string | null;

  @Column({ name: 'list_price_brl', type: 'decimal', precision: 10, scale: 2, default: 0 })
  listPriceBrl: string;

  @Column({ name: 'discount_brl', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountBrl: string;

  @Column({ name: 'coins_used', type: 'int', default: 0 })
  coinsUsed: number;

  @Column({ name: 'coins_value_brl', type: 'decimal', precision: 10, scale: 2, default: 0 })
  coinsValueBrl: string;

  @Column({ name: 'brl_to_pay', type: 'decimal', precision: 10, scale: 2, default: 0 })
  brlToPay: string;

  @Column({ name: 'voucher_code', type: 'varchar', length: 20, nullable: true })
  voucherCode: string | null;

  @Column({ name: 'campaign_id', type: 'varchar', length: 36, nullable: true })
  campaignId: string | null;

  @Index('IDX_ORD_STATUS')
  @Column({
    type: 'enum',
    enum: ['pending', 'awaiting_payment', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending',
  })
  status: OrderStatus;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: ['stripe', 'coins_only', 'free', 'admin'],
    default: 'stripe',
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
