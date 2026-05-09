import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ForumCategory } from './forum-category.entity';
import { ForumPost } from './forum-post.entity';

@Entity({ name: 'forum_topics' })
export class ForumTopic {
  @PrimaryGeneratedColumn({ unsigned: true })
  id: number;

  @Index('IDX_FORUM_TOPIC_CAT')
  @Column({ name: 'category_id', type: 'int', unsigned: true })
  categoryId: number;

  @Index('IDX_FORUM_TOPIC_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  views: number;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  isPinned: boolean;

  @Index('IDX_FORUM_TOPIC_CREATED')
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => ForumCategory, (category) => category.topics, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: ForumCategory;

  @OneToMany(() => ForumPost, (post) => post.topic)
  posts: ForumPost[];

  // Campo virtual: número de posts (populado pelo service)
  postCount?: number;

  // Campo virtual: autor (populado pelo service)
  author?: { username: string };
}
