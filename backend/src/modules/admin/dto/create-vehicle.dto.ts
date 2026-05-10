import { IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVehicleDto {
  @IsString() @MaxLength(120)
  name: string;

  @IsOptional() @IsString() @MaxLength(10)
  icon?: string;

  @Type(() => Number) @IsNumber() @Min(0)
  priceCoins: number;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  speed?: number;

  @IsOptional() @IsString()
  materialId?: string;

  @IsOptional() @Type(() => Number) @IsNumber()
  scaleFactor?: number;
}
