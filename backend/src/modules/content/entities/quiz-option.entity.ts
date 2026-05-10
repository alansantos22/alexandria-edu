import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'quiz_options' })
export class QuizOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_QOPT_QUESTION')
  @Column({ name: 'question_id', type: 'varchar', length: 36 })
  questionId: string;

  @Column({ type: 'varchar', length: 500 })
  text: string;

  @Column({ name: 'is_correct', type: 'boolean', default: false })
  isCorrect: boolean;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;
}
