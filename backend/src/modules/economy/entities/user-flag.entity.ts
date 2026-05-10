import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type FlagType = 'ANOMALY_SPEED' | 'MANUAL_REVIEW';

@Entity({ name: 'user_flags' })
export class UserFlag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_FLAG_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Index('IDX_FLAG_TYPE')
  @Column({ name: 'flag_type', type: 'varchar', length: 50 })
  flagType: FlagType;

  @Column({ type: 'text', nullable: true })
  detail: string | null;

  @Index('IDX_FLAG_REVIEWED')
  @Column({ name: 'is_reviewed', type: 'boolean', default: false })
  isReviewed: boolean;

  @Column({ name: 'reviewed_by', type: 'varchar', length: 36, nullable: true })
  reviewedBy: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Index('IDX_FLAG_CREATED')
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
