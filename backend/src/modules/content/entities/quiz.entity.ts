import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'quizzes' })
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_QUIZ_MODULE')
  @Column({ name: 'module_id', type: 'varchar', length: 36 })
  moduleId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'time_window_seconds', type: 'int', default: 45 })
  timeWindowSeconds: number;

  @Column({ name: 'passing_score', type: 'tinyint', default: 70 })
  passingScore: number;

  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
