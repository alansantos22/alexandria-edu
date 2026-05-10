import { Module }        from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Trail }         from './entities/trail.entity';
import { Course }        from './entities/course.entity';
import { CourseModule }  from './entities/course-module.entity';
import { Quiz }          from './entities/quiz.entity';
import { QuizQuestion }  from './entities/quiz-question.entity';
import { QuizOption }    from './entities/quiz-option.entity';

import { ContentRepository } from './content.repository';
import { ContentService }    from './content.service';
import { ContentController } from './content.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trail, Course, CourseModule, Quiz, QuizQuestion, QuizOption]),
  ],
  controllers: [ContentController],
  providers:   [ContentRepository, ContentService],
  exports:     [ContentService],
})
export class ContentModule {}
