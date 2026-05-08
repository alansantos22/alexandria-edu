import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'lessons' })
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'video_url', type: 'varchar', length: 500, nullable: true })
  videoUrl: string | null;

  @Column({ name: 'material_link', type: 'varchar', length: 500, nullable: true })
  materialLink: string | null;

  @Index('IDX_LESSONS_ORDER')
  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Index('IDX_LESSONS_PUBLISHED')
  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
