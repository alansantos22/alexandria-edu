import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class PlaceBuildingDto {
  @IsUUID()
  paletteItemId: string;

  @IsInt()
  @Min(-999)
  @Max(999)
  gridX: number;

  @IsInt()
  @Min(-999)
  @Max(999)
  gridZ: number;

  @IsOptional()
  @IsIn([0, 90, 180, 270])
  rotation?: number;
}
