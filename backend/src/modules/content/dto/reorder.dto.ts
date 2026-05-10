import { IsArray, IsInt, IsUUID, Min } from 'class-validator';

export class ReorderItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(0)
  orderIndex: number;
}

export class ReorderDto {
  @IsArray()
  items: ReorderItemDto[];

  /** 'trails' | 'courses' | 'modules' | 'lessons' */
  type: string;
}
