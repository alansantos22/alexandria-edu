import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForumCategory } from './entities/forum-category.entity';
import { ForumTopic } from './entities/forum-topic.entity';
import { ForumPost } from './entities/forum-post.entity';

@Injectable()
export class ForumRepository {
  constructor(
    @InjectRepository(ForumCategory)
    private readonly categories: Repository<ForumCategory>,

    @InjectRepository(ForumTopic)
    private readonly topics: Repository<ForumTopic>,

    @InjectRepository(ForumPost)
    private readonly posts: Repository<ForumPost>,
  ) {}

  // ── Categories ────────────────────────────────────────────

  findAllCategories(): Promise<ForumCategory[]> {
    return this.categories.find({ order: { orderIndex: 'ASC' } });
  }

  findCategoryById(id: number): Promise<ForumCategory | null> {
    return this.categories.findOne({ where: { id } });
  }

  // ── Topics ────────────────────────────────────────────────

  async findTopicsByCategory(
    categoryId: number,
    page: number,
    limit: number,
  ): Promise<{ topics: ForumTopic[]; total: number }> {
    const [topics, total] = await this.topics.findAndCount({
      where: { categoryId },
      order: { isPinned: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { topics, total };
  }

  findTopicById(id: number): Promise<ForumTopic | null> {
    return this.topics.findOne({ where: { id } });
  }

  createTopic(data: Partial<ForumTopic>): Promise<ForumTopic> {
    return this.topics.save(this.topics.create(data));
  }

  async incrementViews(id: number): Promise<void> {
    await this.topics.increment({ id }, 'views', 1);
  }

  countPostsByTopic(topicId: number): Promise<number> {
    return this.posts.count({ where: { topicId } });
  }

  countTopicsByCategory(categoryId: number): Promise<number> {
    return this.topics.count({ where: { categoryId } });
  }

  // ── Posts ─────────────────────────────────────────────────

  async findPostsByTopic(
    topicId: number,
    page: number,
    limit: number,
  ): Promise<{ posts: ForumPost[]; total: number }> {
    const [posts, total] = await this.posts.findAndCount({
      where: { topicId },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { posts, total };
  }

  createPost(data: Partial<ForumPost>): Promise<ForumPost> {
    return this.posts.save(this.posts.create(data));
  }
}
