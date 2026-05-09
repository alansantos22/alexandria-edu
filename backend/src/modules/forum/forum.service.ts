import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ForumRepository } from './forum.repository';
import { User } from '../users/entities/user.entity';

const TOPICS_PER_PAGE = 20;
const POSTS_PER_PAGE  = 30;

@Injectable()
export class ForumService {
  constructor(
    private readonly forumRepo: ForumRepository,

    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // ── Categories ────────────────────────────────────────────

  async getCategories() {
    const cats = await this.forumRepo.findAllCategories();
    const counts = await Promise.all(
      cats.map((c) => this.forumRepo.countTopicsByCategory(c.id)),
    );
    return cats.map((c, i) => ({ ...c, topicCount: counts[i] }));
  }

  // ── Topics ────────────────────────────────────────────────

  async getTopics(categoryId: number, page = 1) {
    const category = await this.forumRepo.findCategoryById(categoryId);
    if (!category) throw new NotFoundException('Categoria não encontrada');

    const { topics, total } = await this.forumRepo.findTopicsByCategory(
      categoryId,
      page,
      TOPICS_PER_PAGE,
    );

    const userIds = [...new Set(topics.map((t) => t.userId))];
    const userMap = await this.buildUserMap(userIds);

    const postCounts = await Promise.all(
      topics.map((t) => this.forumRepo.countPostsByTopic(t.id)),
    );

    return {
      category,
      topics: topics.map((t, i) => ({
        ...t,
        postCount: postCounts[i],
        author: userMap[t.userId] ?? { username: 'Usuário' },
      })),
      pagination: buildPagination(total, page, TOPICS_PER_PAGE),
    };
  }

  async createTopic(categoryId: number, userId: string, title: string, content: string) {
    const category = await this.forumRepo.findCategoryById(categoryId);
    if (!category) throw new NotFoundException('Categoria não encontrada');
    return this.forumRepo.createTopic({ categoryId, userId, title, content });
  }

  // ── Topic detail ──────────────────────────────────────────

  async getTopic(topicId: number, page = 1) {
    const topic = await this.forumRepo.findTopicById(topicId);
    if (!topic) throw new NotFoundException('Tópico não encontrado');

    await this.forumRepo.incrementViews(topicId);

    const { posts, total } = await this.forumRepo.findPostsByTopic(
      topicId,
      page,
      POSTS_PER_PAGE,
    );

    const userIds = [...new Set([topic.userId, ...posts.map((p) => p.userId)])];
    const userMap = await this.buildUserMap(userIds);

    const topicAuthor = userMap[topic.userId] ?? { username: 'Usuário' };

    // Na página 1, inclui o conteúdo do tópico como primeiro "post" (estilo OP)
    const opPost = page === 1
      ? [{
          id: 0,
          topicId,
          userId: topic.userId,
          content: topic.content,
          createdAt: topic.createdAt,
          updatedAt: topic.updatedAt,
          author: topicAuthor,
        }]
      : [];

    return {
      topic: { ...topic, author: topicAuthor },
      posts: [...opPost, ...posts.map((p) => ({ ...p, author: userMap[p.userId] ?? { username: 'Usuário' } }))],
      pagination: buildPagination(total, page, POSTS_PER_PAGE),
    };
  }

  // ── Posts ─────────────────────────────────────────────────

  async createPost(topicId: number, userId: string, content: string) {
    const topic = await this.forumRepo.findTopicById(topicId);
    if (!topic) throw new NotFoundException('Tópico não encontrado');
    return this.forumRepo.createPost({ topicId, userId, content });
  }

  // ── Helpers ───────────────────────────────────────────────

  private async buildUserMap(userIds: string[]): Promise<Record<string, { username: string }>> {
    if (!userIds.length) return {};
    const found = await this.users.find({
      where: { id: In(userIds) },
      select: ['id', 'username'],
    });
    return Object.fromEntries(found.map((u) => [u.id, { username: u.username }]));
  }
}

function buildPagination(total: number, page: number, limit: number) {
  const pages = Math.ceil(total / limit);
  return { total, page, pages, hasNext: page < pages, hasPrev: page > 1 };
}
