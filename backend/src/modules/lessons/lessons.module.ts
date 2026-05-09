import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { User } from '../users/entities/user.entity';
import { LessonsRepository } from './lessons.repository';
import { ProgressRepository } from './progress.repository';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson, UserLessonProgress, User])],
  controllers: [LessonsController],
  providers: [LessonsRepository, ProgressRepository, LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
