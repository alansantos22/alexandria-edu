import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export type AdjustDirection = 'credit' | 'debit';

export class AdminAdjustCoinsDto {
  @IsUUID()
  userId: string;

  @IsEnum(['credit', 'debit'])
  direction: AdjustDirection;

  @IsInt()
  @Min(1)
  @Max(100_000)
  amount: number;

  @IsString()
  note: string;
}

export class ReviewFlagDto {
  @IsOptional()
  @IsString()
  note?: string;
}
