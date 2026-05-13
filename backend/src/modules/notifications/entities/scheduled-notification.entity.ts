import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type ScheduledNotificationKind =
  | 'reminder_60min' | 'reminder_15min' | 'starting' | 'recording_available';

@Entity({ name: 'scheduled_notifications' })
export class ScheduledNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'live_class_id', type: 'varchar', length: 36 })
  liveClassId: string;

  @Column({
    type: 'enum',
    enum: ['reminder_60min', 'reminder_15min', 'starting', 'recording_available'],
  })
  kind: ScheduledNotificationKind;

  @Column({ name: 'scheduled_for', type: 'timestamp' })
  scheduledFor: Date;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
