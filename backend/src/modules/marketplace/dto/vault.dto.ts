import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class GenerateTokenDto {
  @IsUUID()
  itemId: string;

  /** Máximo de usos (default 1) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxUses?: number;

  /** Data de expiração ISO string (opcional) */
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class RedeemTokenDto {
  @IsString()
  code: string;
}
