import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type CohortStatus =
  | 'draft' | 'open' | 'closed' | 'running' | 'finished' | 'cancelled';

@Entity({ name: 'cohorts' })
export class Cohort {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_COHORTS_PRODUCT')
  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @Column({ type: 'int', nullable: true })
  capacity: number | null;

  @Column({ type: 'varchar', length: 64, default: 'America/Sao_Paulo' })
  timezone: string;

  @Column({ name: 'starts_at', type: 'timestamp', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamp', nullable: true })
  endsAt: Date | null;

  @Index('IDX_COHORTS_STATUS')
  @Column({
    type: 'enum',
    enum: ['draft', 'open', 'closed', 'running', 'finished', 'cancelled'],
    default: 'draft',
  })
  status: CohortStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
