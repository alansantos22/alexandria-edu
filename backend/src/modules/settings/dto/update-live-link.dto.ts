import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateLiveLinkDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  link: string;
}
