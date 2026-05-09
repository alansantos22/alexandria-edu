import { IsIn, IsOptional, IsString } from 'class-validator';

export class EquipItemDto {
  /** null = desequipar o slot indicado em `type` */
  @IsOptional()
  @IsString()
  itemId: string | null;

  /**
   * Obrigatório apenas quando itemId é null (para saber qual slot limpar).
   * Quando itemId é informado, o tipo é derivado do item no banco.
   */
  @IsOptional()
  @IsString()
  @IsIn(['avatar', 'wallpaper', 'badge', 'frame'])
  type?: 'avatar' | 'wallpaper' | 'badge' | 'frame';
}
