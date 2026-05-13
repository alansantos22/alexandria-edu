import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'live_class_attendance' })
export class LiveClassAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'live_class_id', type: 'varchar', length: 36 })
  liveClassId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @CreateDateColumn({ name: 'joined_at', type: 'timestamp' })
  joinedAt: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt: Date | null;

  @Column({ name: 'watch_seconds', type: 'int', default: 0 })
  watchSeconds: number;
}
