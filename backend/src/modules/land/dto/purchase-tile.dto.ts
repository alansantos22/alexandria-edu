import { IsInt, Max, Min } from 'class-validator'

export class PurchaseTileDto {
  @IsInt()
  @Min(0)
  @Max(4)
  tileX: number

  @IsInt()
  @Min(0)
  @Max(4)
  tileZ: number
}
