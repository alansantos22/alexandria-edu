import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from './entities/lesson.entity';

@Injectable()
export class LessonsRepository {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  async findAllPublished(): Promise<Lesson[]> {
    return this.repository.find({
      where: { isPublished: true },
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    });
  }

  async findAll(): Promise<Lesson[]> {
    return this.repository.find({
      order: { orderIndex: 'ASC', createdAt: 'ASC' },
    });
  }

  async findById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({ where: { id } });
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    return this.repository.save(this.repository.create(data));
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
