import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentRepository } from './content.repository';
import { CreateTrailDto, UpdateTrailDto } from './dto/trail.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateCourseModuleDto, UpdateCourseModuleDto, AssignLessonDto } from './dto/course-module.dto';
import { CreateQuizDto, AddQuizQuestionDto } from './dto/quiz.dto';
import { ReorderDto } from './dto/reorder.dto';

@Injectable()
export class ContentService {
  constructor(private readonly contentRepository: ContentRepository) {}

  // ── Trilhas ────────────────────────────────────────────────────────────────

  listHierarchy() {
    return this.contentRepository.listTrailsWithChildren();
  }

  async createTrail(dto: CreateTrailDto) {
    return this.contentRepository.createTrail(dto);
  }

  async updateTrail(id: string, dto: UpdateTrailDto) {
    const trail = await this.contentRepository.updateTrail(id, dto);
    if (!trail) throw new NotFoundException(`Trilha ${id} não encontrada`);
    return trail;
  }

  // ── Cursos ─────────────────────────────────────────────────────────────────

  async createCourse(dto: CreateCourseDto) {
    const trail = await this.contentRepository.findTrailById(dto.trailId);
    if (!trail) throw new NotFoundException(`Trilha ${dto.trailId} não encontrada`);
    return this.contentRepository.createCourse(dto);
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const course = await this.contentRepository.updateCourse(id, dto);
    if (!course) throw new NotFoundException(`Curso ${id} não encontrado`);
    return course;
  }

  // ── Módulos ────────────────────────────────────────────────────────────────

  async createModule(dto: CreateCourseModuleDto) {
    return this.contentRepository.createModule(dto);
  }

  async updateModule(id: string, dto: UpdateCourseModuleDto) {
    const mod = await this.contentRepository.updateModule(id, dto);
    if (!mod) throw new NotFoundException(`Módulo ${id} não encontrado`);
    return mod;
  }

  async assignLesson(moduleId: string, dto: AssignLessonDto) {
    await this.contentRepository.assignLessonToModule(moduleId, dto.lessonId);
    return { ok: true };
  }

  // ── Provas ─────────────────────────────────────────────────────────────────

  async createQuiz(dto: CreateQuizDto) {
    return this.contentRepository.createQuiz(dto);
  }

  async addQuestion(quizId: string, dto: AddQuizQuestionDto) {
    return this.contentRepository.addQuestion(quizId, dto);
  }

  async getQuiz(quizId: string) {
    const quiz = await this.contentRepository.getQuizWithQuestions(quizId);
    if (!quiz) throw new NotFoundException(`Prova ${quizId} não encontrada`);
    return quiz;
  }

  // ── Reordenação ────────────────────────────────────────────────────────────

  async reorder(dto: ReorderDto) {
    await this.contentRepository.reorder(dto);
    return { ok: true };
  }
}
