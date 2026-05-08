import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonsRepository } from './lessons.repository';
import { Lesson } from './entities/lesson.entity';

@Injectable()
export class LessonsService {
  constructor(private readonly lessonsRepository: LessonsRepository) {}

  async listForStudent(): Promise<Lesson[]> {
    return this.lessonsRepository.findAllPublished();
  }

  async listAll(): Promise<Lesson[]> {
    return this.lessonsRepository.findAll();
  }

  async getById(id: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) throw new NotFoundException('Aula não encontrada');
    return lesson;
  }

  async create(data: Partial<Lesson>): Promise<Lesson> {
    return this.lessonsRepository.create(data);
  }

  async update(id: string, data: Partial<Lesson>): Promise<Lesson> {
    await this.getById(id);
    return this.lessonsRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.lessonsRepository.delete(id);
  }
}
