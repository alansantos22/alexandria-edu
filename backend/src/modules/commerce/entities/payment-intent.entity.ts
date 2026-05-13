import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'payment_intents' })
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'varchar', length: 36 })
  orderId: string;

  @Column({ name: 'stripe_pi_id', type: 'varchar', length: 120, unique: true })
  stripePiId: string;

  @Column({ name: 'client_secret', type: 'varchar', length: 255, nullable: true })
  clientSecret: string | null;

  @Column({ type: 'varchar', length: 40, default: 'requires_payment_method' })
  status: string;

  @Column({ name: 'amount_brl', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountBrl: string;

  @Column({ name: 'last_event', type: 'varchar', length: 80, nullable: true })
  lastEvent: string | null;

  @Column({ name: 'raw_last_event', type: 'json', nullable: true })
  rawLastEvent: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
