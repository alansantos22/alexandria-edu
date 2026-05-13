import {
  Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'notification_preferences' })
export class NotificationPreference {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'in_app_enabled', type: 'boolean', default: true })
  inAppEnabled: boolean;

  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ name: 'remind_60min', type: 'boolean', default: true })
  remind60min: boolean;

  @Column({ name: 'remind_15min', type: 'boolean', default: true })
  remind15min: boolean;

  @Column({ name: 'promo_emails', type: 'boolean', default: true })
  promoEmails: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
