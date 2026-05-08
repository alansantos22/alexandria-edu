import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lesson } from './entities/lesson.entity';
import { LessonsRepository } from './lessons.repository';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lesson])],
  controllers: [LessonsController],
  providers: [LessonsRepository, LessonsService],
  exports: [LessonsService],
})
export class LessonsModule {}
