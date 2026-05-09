import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { ActiveUserGuard } from '@/common/guards/active-user.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface';
import { IsNotEmpty, IsString, MinLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

class CreateReplyDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  topicId: number;
}

class CreateTopicDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  categoryId: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;
}

@Controller('forum')
@UseGuards(ActiveUserGuard)
export class ForumController {
  constructor(private readonly forumService: ForumService) {}

  /** Lista todas as categorias do fórum */
  @Get('categories')
  getCategories() {
    return this.forumService.getCategories();
  }

  /** Lista tópicos de uma categoria */
  @Get('categories/:categoryId/topics')
  getTopics(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query('page') page = 1,
  ) {
    return this.forumService.getTopics(categoryId, Number(page));
  }

  /** Retorna detalhe de um tópico com posts/respostas */
  @Get('topics/:topicId')
  getTopic(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query('page') page = 1,
  ) {
    return this.forumService.getTopic(topicId, Number(page));
  }

  /** Cria um novo tópico */
  @Post('topics')
  @HttpCode(HttpStatus.CREATED)
  createTopic(
    @Body() dto: CreateTopicDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createTopic(dto.categoryId, user.id, dto.title, dto.content);
  }

  /** Responde a um tópico existente */
  @Post('topics/:topicId/reply')
  @HttpCode(HttpStatus.CREATED)
  createReply(
    @Param('topicId', ParseIntPipe) topicId: number,
    @Body() dto: CreateReplyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.forumService.createPost(topicId, user.id, dto.content);
  }
}
