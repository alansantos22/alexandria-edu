import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type LiveClassProvider = 'manual' | 'livekit' | 'jitsi' | 'meet' | 'zoom';
export type LiveClassStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';

@Entity({ name: 'live_classes' })
export class LiveClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'cohort_id', type: 'varchar', length: 36 })
  cohortId: string;

  @Column({ name: 'course_id', type: 'varchar', length: 36, nullable: true })
  courseId: string | null;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  theme: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('IDX_LC_STARTS')
  @Column({ name: 'starts_at', type: 'timestamp' })
  startsAt: Date;

  @Column({ name: 'duration_min', type: 'int', default: 60 })
  durationMin: number;

  @Column({ type: 'varchar', length: 64, default: 'America/Sao_Paulo' })
  timezone: string;

  @Column({
    type: 'enum',
    enum: ['manual', 'livekit', 'jitsi', 'meet', 'zoom'],
    default: 'manual',
  })
  provider: LiveClassProvider;

  @Column({ name: 'room_id', type: 'varchar', length: 255, nullable: true })
  roomId: string | null;

  /** URL real do provedor — NUNCA exposta ao cliente diretamente */
  @Column({ name: 'external_url', type: 'varchar', length: 1000, nullable: true })
  externalUrl: string | null;

  @Column({ name: 'recording_url', type: 'varchar', length: 1000, nullable: true })
  recordingUrl: string | null;

  @Index('IDX_LC_STATUS')
  @Column({
    type: 'enum',
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
  })
  status: LiveClassStatus;

  @Column({ name: 'capacity_override', type: 'int', nullable: true })
  capacityOverride: number | null;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
