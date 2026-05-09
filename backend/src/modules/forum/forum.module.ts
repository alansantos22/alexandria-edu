import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumController } from './forum.controller';
import { ForumService } from './forum.service';
import { ForumRepository } from './forum.repository';
import { ForumCategory } from './entities/forum-category.entity';
import { ForumTopic } from './entities/forum-topic.entity';
import { ForumPost } from './entities/forum-post.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForumCategory, ForumTopic, ForumPost, User])],
  controllers: [ForumController],
  providers: [ForumRepository, ForumService],
})
export class ForumModule {}
