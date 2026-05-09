import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ForumTopic } from './forum-topic.entity';

@Entity({ name: 'forum_posts' })
export class ForumPost {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index('IDX_FORUM_POST_TOPIC')
  @Column({ name: 'topic_id', type: 'int', unsigned: true })
  topicId: number;

  @Index('IDX_FORUM_POST_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'text' })
  content: string;

  @Index('IDX_FORUM_POST_CREATED')
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => ForumTopic, (topic) => topic.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topic_id' })
  topic: ForumTopic;

  // Campo virtual: autor (populado pelo service)
  author?: { username: string };
}
