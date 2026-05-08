import {
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'settings' })
export class Setting {
  @PrimaryColumn({ name: 'key_name', type: 'varchar', length: 100 })
  keyName: string;

  @Column({ type: 'text', nullable: true })
  value: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
