import { IsEnum, IsHexColor, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import type { Rarity } from '../../marketplace/entities/marketplace-item.entity';

/**
 * DTO para criação de paleta de cores no marketplace.
 *
 * Cada paleta define 5 papéis semânticos que o sistema aplica
 * automaticamente em todo o perfil do usuário:
 *
 *  primary       → fundo de botões, barra de XP, badge de nível
 *  primaryDark   → hover de botões, superfícies elevadas
 *  secondary     → cor das bordas dos cards e painéis
 *  secondaryDark → hover das bordas, acentos sutis
 *  tertiary      → ícones destacados, links, chips de raridade
 *
 * Os campos `primary` e `tertiary` aceitam hex (#RRGGBB) ou
 * qualquer CSS gradient válido (linear-gradient / radial-gradient).
 * Os demais campos aceitam apenas hex sólido.
 */
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

  /** Botões, barra XP, badge de nível — aceita hex ou CSS gradient */
  @IsString()
  @MaxLength(500)
  primary: string;

  /** Hover de botões, fundos elevados — apenas hex */
  @IsHexColor()
  primaryDark: string;

  /** Bordas dos cards e painéis — apenas hex */
  @IsHexColor()
  secondary: string;

  /** Hover das bordas, acentos sutis — apenas hex */
  @IsHexColor()
  secondaryDark: string;

  /** Ícones, links, chips de raridade — aceita hex ou CSS gradient */
  @IsString()
  @MaxLength(500)
  tertiary: string;
}
