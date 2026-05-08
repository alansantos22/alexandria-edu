import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUrl({}, { message: 'video_url deve ser uma URL válida' })
  @MaxLength(500)
  videoUrl?: string;

  @IsOptional()
  @IsUrl({}, { message: 'material_link deve ser uma URL válida' })
  @MaxLength(500)
  materialLink?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
