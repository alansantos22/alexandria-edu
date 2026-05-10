import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'city_palette_assets' })
export class BuildingAsset {
  @PrimaryColumn({ name: 'palette_item_id', type: 'varchar', length: 36 })
  paletteItemId: string;

  @Column({ name: 'texture_albedo', nullable: true, length: 512 })
  textureAlbedo: string | null;

  @Column({ name: 'texture_normal', nullable: true, length: 512 })
  textureNormal: string | null;

  @Column({ name: 'texture_roughness_metalness', nullable: true, length: 512 })
  textureRoughnessMetalness: string | null;

  @Column({ name: 'texture_ao', nullable: true, length: 512 })
  textureAo: string | null;

  @Column({ type: 'float', default: 0.7 })
  roughness: number;

  @Column({ type: 'float', default: 0.0 })
  metalness: number;

  @Column({ name: 'scale_factor', type: 'float', default: 1.0 })
  scaleFactor: number;
}
