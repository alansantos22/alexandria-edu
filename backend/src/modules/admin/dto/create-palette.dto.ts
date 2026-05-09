import { IsEnum, IsHexColor, IsInt, IsOptional, IsString, MaxLength, Min, ValidateIf, IsIn, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import type { Rarity } from '../../marketplace/entities/marketplace-item.entity';

export type GradientDirection =
  | 'to right'
  | 'to left'
  | 'to bottom'
  | 'to top'
  | '45deg'
  | '135deg'
  | '90deg'
  | 'radial';

export class CreatePaletteDto {
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

  /**
   * Array de 1 a 4 cores hex.
   * 1 cor = sólida; 2-4 cores = gradiente
   */
  @IsArray()
  @ArrayMaxSize(4)
  @IsHexColor({ each: true })
  colors: string[];

  /**
   * Direção do gradiente — ignorado se colors.length === 1
   */
  @IsOptional()
  @IsIn(['to right', 'to left', 'to bottom', 'to top', '45deg', '135deg', '90deg', 'radial'])
  direction?: GradientDirection;
}
