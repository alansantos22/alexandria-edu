import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateVoucherDto {
  /** Nome amigável / campanha */
  @IsOptional()
  @IsString()
  label?: string;

  /** Máximo de usos (default 1) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  maxUses?: number;

  /** Dias de acesso concedidos ao usuário (default 30) */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3650)
  accessDays?: number;

  /** Data de expiração do voucher ISO string (opcional) */
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class RedeemVoucherDto {
  @IsString()
  code: string;
}
