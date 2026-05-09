import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Rarity } from '../../marketplace/entities/marketplace-item.entity';

export class CreateBackgroundDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;

  @IsEnum(['common', 'rare', 'epic', 'legendary'])
  rarity: Rarity;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCoins: number;

  /** null = ilimitado */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  stock?: number;
}
