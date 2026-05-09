import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'user_lesson_progress' })
@Unique('UK_PROGRESS_USER_LESSON', ['userId', 'lessonId'])
export class UserLessonProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_PROGRESS_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Index('IDX_PROGRESS_LESSON')
  @Column({ name: 'lesson_id', type: 'varchar', length: 36 })
  lessonId: string;

  @CreateDateColumn({ name: 'completed_at', type: 'timestamp' })
  completedAt: Date;
}
