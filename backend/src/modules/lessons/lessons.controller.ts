import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { ActiveUserGuard } from '@/common/guards/active-user.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @UseGuards(ActiveUserGuard)
  async list(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'admin') return this.lessonsService.listAll();
    return this.lessonsService.listForStudent();
  }

  @Get('progress')
  @UseGuards(ActiveUserGuard)
  async getProgress(@CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.getProgress(user.id);
  }

  @Get(':id')
  @UseGuards(ActiveUserGuard)
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.lessonsService.getById(id);
  }

  @Post(':id/complete')
  @UseGuards(ActiveUserGuard)
  @HttpCode(HttpStatus.OK)
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.completeLesson(user.id, id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.lessonsService.delete(id);
  }
}
