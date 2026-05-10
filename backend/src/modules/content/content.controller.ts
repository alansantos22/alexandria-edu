import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles }      from '../../common/decorators/roles.decorator';
import { ContentService } from './content.service';
import { CreateTrailDto, UpdateTrailDto } from './dto/trail.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { AssignLessonDto, CreateCourseModuleDto, UpdateCourseModuleDto } from './dto/course-module.dto';
import { AddQuizQuestionDto, CreateQuizDto } from './dto/quiz.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('admin/content')
@UseGuards(RolesGuard)
@Roles('admin')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // ── Hierarquia completa ────────────────────────────────────────────────────

  @Get('hierarchy')
  getHierarchy() {
    return this.contentService.listHierarchy();
  }

  // ── Trilhas ────────────────────────────────────────────────────────────────

  @Post('trails')
  @HttpCode(HttpStatus.CREATED)
  createTrail(@Body() dto: CreateTrailDto) {
    return this.contentService.createTrail(dto);
  }

  @Patch('trails/:id')
  updateTrail(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTrailDto,
  ) {
    return this.contentService.updateTrail(id, dto);
  }

  // ── Cursos ─────────────────────────────────────────────────────────────────

  @Post('courses')
  @HttpCode(HttpStatus.CREATED)
  createCourse(@Body() dto: CreateCourseDto) {
    return this.contentService.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.contentService.updateCourse(id, dto);
  }

  // ── Módulos ────────────────────────────────────────────────────────────────

  @Post('modules')
  @HttpCode(HttpStatus.CREATED)
  createModule(@Body() dto: CreateCourseModuleDto) {
    return this.contentService.createModule(dto);
  }

  @Patch('modules/:id')
  updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseModuleDto,
  ) {
    return this.contentService.updateModule(id, dto);
  }

  @Post('modules/:id/lessons')
  @HttpCode(HttpStatus.OK)
  assignLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignLessonDto,
  ) {
    return this.contentService.assignLesson(id, dto);
  }

  // ── Provas ─────────────────────────────────────────────────────────────────

  @Post('quizzes')
  @HttpCode(HttpStatus.CREATED)
  createQuiz(@Body() dto: CreateQuizDto) {
    return this.contentService.createQuiz(dto);
  }

  @Get('quizzes/:id')
  getQuiz(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.getQuiz(id);
  }

  @Post('quizzes/:id/questions')
  @HttpCode(HttpStatus.CREATED)
  addQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddQuizQuestionDto,
  ) {
    return this.contentService.addQuestion(id, dto);
  }

  // ── Reordenação (Drag & Drop) ──────────────────────────────────────────────

  @Patch('reorder')
  @HttpCode(HttpStatus.OK)
  reorder(@Body() dto: ReorderDto) {
    return this.contentService.reorder(dto);
  }
}
