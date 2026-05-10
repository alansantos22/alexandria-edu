import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'course_modules' })
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_MOD_COURSE')
  @Column({ name: 'course_id', type: 'varchar', length: 36 })
  courseId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index('IDX_MOD_ORDER')
  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Index('IDX_MOD_PUBLISHED')
  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
