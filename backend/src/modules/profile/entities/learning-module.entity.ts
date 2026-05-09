import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Nomeado LearningModule para evitar conflito com a palavra reservada 'module' do TypeScript */
@Entity({ name: 'modules' })
export class LearningModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_MODULE_TRACK')
  @Column({ name: 'track_id', type: 'varchar', length: 36 })
  trackId: string;

  @Index('UK_MODULE_CODE', { unique: true })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('IDX_MODULE_ORDER')
  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
