import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type CoinEventType =
  | 'LESSON_COMPLETE'
  | 'QUIZ_PASS_70'
  | 'QUIZ_PASS_90'
  | 'DAILY_STREAK'
  | 'COURSE_PURCHASE_CASHBACK'
  | 'MARKETPLACE_PURCHASE'
  | 'ADMIN_ADJUSTMENT';

@Entity({ name: 'coin_transactions' })
export class CoinTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_COIN_TX_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  /** Positivo = crédito, Negativo = débito */
  @Column({ type: 'int' })
  delta: number;

  @Column({ name: 'balance_after', type: 'int', default: 0 })
  balanceAfter: number;

  @Index('IDX_COIN_TX_EVENT')
  @Column({ name: 'event_type', type: 'varchar', length: 50 })
  eventType: CoinEventType;

  @Column({ name: 'reference_id', type: 'varchar', length: 36, nullable: true })
  referenceId: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Index('IDX_COIN_TX_CREATED')
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
