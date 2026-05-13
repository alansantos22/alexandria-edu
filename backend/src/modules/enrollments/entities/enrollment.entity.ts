import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type EnrollmentSource = 'purchase' | 'invite' | 'admin' | 'free';
export type EnrollmentStatus = 'active' | 'expired' | 'cancelled';

@Entity({ name: 'enrollments' })
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_ENR_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @Index('IDX_ENR_COHORT')
  @Column({ name: 'cohort_id', type: 'varchar', length: 36, nullable: true })
  cohortId: string | null;

  @Column({
    type: 'enum',
    enum: ['purchase', 'invite', 'admin', 'free'],
    default: 'purchase',
  })
  source: EnrollmentSource;

  @Column({ name: 'source_ref', type: 'varchar', length: 64, nullable: true })
  sourceRef: string | null;

  @CreateDateColumn({ name: 'granted_at', type: 'timestamp' })
  grantedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ name: 'lessons_quota', type: 'int', nullable: true })
  lessonsQuota: number | null;

  @Column({ name: 'lessons_consumed', type: 'int', default: 0 })
  lessonsConsumed: number;

  @Index('IDX_ENR_STATUS')
  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'cancelled'],
    default: 'active',
  })
  status: EnrollmentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
