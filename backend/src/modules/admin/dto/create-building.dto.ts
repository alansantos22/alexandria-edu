import {
  IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBuildingDto {
  @IsString() @MaxLength(120)
  name: string;

  @IsEnum(['residential', 'commercial', 'nature', 'road', 'decoration'])
  category: 'residential' | 'commercial' | 'nature' | 'road' | 'decoration';

  @IsEnum(['grid', 'free'])
  placement: 'grid' | 'free';

  @Type(() => Number) @IsInt() @Min(1)
  ccuCost: number;

  @Type(() => Number) @IsInt() @Min(1)
  sizeX: number;

  @Type(() => Number) @IsInt() @Min(1)
  sizeZ: number;

  @Type(() => Number) @IsInt() @Min(0)
  priceCoins: number;

  @IsOptional() @IsString() @MaxLength(10)
  icon?: string;

  @IsOptional() @IsString()
  materialId?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  scaleFactor?: number;
}
