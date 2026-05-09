import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Badge }           from './entities/badge.entity';
import { UserBadge }       from './entities/user-badge.entity';
import { Card }            from './entities/card.entity';
import { UserCard }        from './entities/user-card.entity';
import { Track }           from './entities/track.entity';
import { LearningModule }  from './entities/learning-module.entity';

import { Lesson }              from '@/modules/lessons/entities/lesson.entity';
import { UserLessonProgress }  from '@/modules/lessons/entities/user-lesson-progress.entity';

import { UsersModule }    from '@/modules/users/users.module';
import { ProfileRepository } from './profile.repository';
import { ProfileService }    from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Badge, UserBadge, Card, UserCard, Track, LearningModule,
      Lesson, UserLessonProgress,
    ]),
    UsersModule,
  ],
  providers:   [ProfileRepository, ProfileService],
  controllers: [ProfileController],
})
export class ProfileModule {}
