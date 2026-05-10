import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { randomUUID } from 'crypto';

import { Trail } from './entities/trail.entity';
import { Course } from './entities/course.entity';
import { CourseModule } from './entities/course-module.entity';
import { Quiz } from './entities/quiz.entity';
import { QuizQuestion } from './entities/quiz-question.entity';
import { QuizOption } from './entities/quiz-option.entity';

import { CreateTrailDto, UpdateTrailDto } from './dto/trail.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateCourseModuleDto, UpdateCourseModuleDto } from './dto/course-module.dto';
import { CreateQuizDto, AddQuizQuestionDto } from './dto/quiz.dto';
import { ReorderDto } from './dto/reorder.dto';

@Injectable()
export class ContentRepository {
  constructor(
    @InjectRepository(Trail)
    private readonly trailRepo: Repository<Trail>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly moduleRepo: Repository<CourseModule>,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly questionRepo: Repository<QuizQuestion>,
    @InjectRepository(QuizOption)
    private readonly optionRepo: Repository<QuizOption>,
    private readonly dataSource: DataSource,
  ) {}

  // ── TRAILS ────────────────────────────────────────────────────────────────

  async listTrailsWithChildren() {
    const trails = await this.trailRepo.find({ order: { orderIndex: 'ASC' } });
    const courses = await this.courseRepo.find({ order: { trailId: 'ASC', orderIndex: 'ASC' } });
    const modules = await this.moduleRepo.find({ order: { courseId: 'ASC', orderIndex: 'ASC' } });

    const lessons = await this.dataSource.query<{ id: string; title: string; order_index: number; is_published: boolean; module_id: string | null }[]>(
      `SELECT id, title, order_index, is_published, module_id FROM lessons ORDER BY module_id, order_index`,
    );

    const quizzes = await this.quizRepo.find({ order: { moduleId: 'ASC' } });

    const moduleMap = new Map(
      modules.map((m) => [
        m.id,
        {
          ...m,
          lessons: lessons
            .filter((l) => l.module_id === m.id)
            .map((l) => ({ id: l.id, title: l.title, orderIndex: l.order_index, isPublished: l.is_published })),
          quizzes: quizzes.filter((q) => q.moduleId === m.id),
        },
      ]),
    );

    const courseMap = new Map(
      courses.map((c) => [
        c.id,
        { ...c, modules: modules.filter((m) => m.courseId === c.id).map((m) => moduleMap.get(m.id)!) },
      ]),
    );

    return trails.map((t) => ({
      ...t,
      courses: courses.filter((c) => c.trailId === t.id).map((c) => courseMap.get(c.id)!),
    }));
  }

  async createTrail(dto: CreateTrailDto): Promise<Trail> {
    const trail = this.trailRepo.create({
      id: randomUUID(),
      title: dto.title,
      description: dto.description ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      orderIndex: dto.orderIndex ?? 0,
      isPublished: dto.isPublished ?? false,
    });
    return this.trailRepo.save(trail);
  }

  async updateTrail(id: string, dto: UpdateTrailDto): Promise<Trail | null> {
    await this.trailRepo.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
    });
    return this.trailRepo.findOne({ where: { id } });
  }

  async findTrailById(id: string): Promise<Trail | null> {
    return this.trailRepo.findOne({ where: { id } });
  }

  // ── COURSES ───────────────────────────────────────────────────────────────

  async createCourse(dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepo.create({
      id: randomUUID(),
      trailId: dto.trailId,
      title: dto.title,
      description: dto.description ?? null,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      orderIndex: dto.orderIndex ?? 0,
      isPublished: dto.isPublished ?? false,
    });
    return this.courseRepo.save(course);
  }

  async updateCourse(id: string, dto: UpdateCourseDto): Promise<Course | null> {
    await this.courseRepo.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
    });
    return this.courseRepo.findOne({ where: { id } });
  }

  // ── MODULES ───────────────────────────────────────────────────────────────

  async createModule(dto: CreateCourseModuleDto): Promise<CourseModule> {
    const mod = this.moduleRepo.create({
      id: randomUUID(),
      courseId: dto.courseId,
      title: dto.title,
      description: dto.description ?? null,
      orderIndex: dto.orderIndex ?? 0,
      isPublished: dto.isPublished ?? false,
    });
    return this.moduleRepo.save(mod);
  }

  async updateModule(id: string, dto: UpdateCourseModuleDto): Promise<CourseModule | null> {
    await this.moduleRepo.update(id, {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
    });
    return this.moduleRepo.findOne({ where: { id } });
  }

  async assignLessonToModule(moduleId: string, lessonId: string): Promise<void> {
    await this.dataSource.query(
      `UPDATE lessons SET module_id = ? WHERE id = ?`,
      [moduleId, lessonId],
    );
  }

  // ── QUIZZES ───────────────────────────────────────────────────────────────

  async createQuiz(dto: CreateQuizDto): Promise<Quiz> {
    const quiz = this.quizRepo.create({
      id: randomUUID(),
      moduleId: dto.moduleId,
      title: dto.title,
      description: dto.description ?? null,
      timeWindowSeconds: dto.timeWindowSeconds ?? 45,
      passingScore: dto.passingScore ?? 70,
      isPublished: dto.isPublished ?? false,
    });
    const saved = await this.quizRepo.save(quiz);

    if (dto.questions?.length) {
      await this.saveQuestions(saved.id, dto.questions);
    }

    return saved;
  }

  private async saveQuestions(
    quizId: string,
    questions: { text: string; reviewLessonId?: string; options: { text: string; isCorrect: boolean }[] }[],
  ): Promise<void> {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionId = randomUUID();
      await this.questionRepo.save(
        this.questionRepo.create({
          id: questionId,
          quizId,
          text: q.text,
          orderIndex: i,
          reviewLessonId: q.reviewLessonId ?? null,
        }),
      );
      for (let j = 0; j < q.options.length; j++) {
        await this.optionRepo.save(
          this.optionRepo.create({
            id: randomUUID(),
            questionId,
            text: q.options[j].text,
            isCorrect: q.options[j].isCorrect,
            orderIndex: j,
          }),
        );
      }
    }
  }

  async addQuestion(quizId: string, dto: AddQuizQuestionDto): Promise<QuizQuestion> {
    const count = await this.questionRepo.count({ where: { quizId } });
    const question = this.questionRepo.create({
      id: randomUUID(),
      quizId,
      text: dto.text,
      orderIndex: count,
      reviewLessonId: dto.reviewLessonId ?? null,
    });
    const savedQ = await this.questionRepo.save(question);

    for (let j = 0; j < dto.options.length; j++) {
      await this.optionRepo.save(
        this.optionRepo.create({
          id: randomUUID(),
          questionId: savedQ.id,
          text: dto.options[j].text,
          isCorrect: dto.options[j].isCorrect,
          orderIndex: j,
        }),
      );
    }

    return savedQ;
  }

  async getQuizWithQuestions(quizId: string) {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) return null;
    const questions = await this.questionRepo.find({
      where: { quizId },
      order: { orderIndex: 'ASC' },
    });
    const options = await this.optionRepo.find({
      where: questions.map((q) => ({ questionId: q.id })),
      order: { orderIndex: 'ASC' },
    });
    return {
      ...quiz,
      questions: questions.map((q) => ({
        ...q,
        options: options.filter((o) => o.questionId === q.id),
      })),
    };
  }

  // ── REORDER ───────────────────────────────────────────────────────────────

  async reorder(dto: ReorderDto): Promise<void> {
    const tableMap: Record<string, string> = {
      trails: 'trails',
      courses: 'courses',
      modules: 'course_modules',
      lessons: 'lessons',
    };

    const table = tableMap[dto.type];
    if (!table) return;

    const queries = dto.items.map((item) =>
      this.dataSource.query(
        `UPDATE ${table} SET order_index = ? WHERE id = ?`,
        [item.orderIndex, item.id],
      ),
    );
    await Promise.all(queries);
  }
}
