import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'quiz_questions' })
export class QuizQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_QQST_QUIZ')
  @Column({ name: 'quiz_id', type: 'varchar', length: 36 })
  quizId: string;

  @Column({ type: 'text' })
  text: string;

  @Index('IDX_QQST_ORDER')
  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({ name: 'review_lesson_id', type: 'varchar', length: 36, nullable: true })
  reviewLessonId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
