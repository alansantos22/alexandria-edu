import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CityMaterial } from './city-material.entity';

@Entity({ name: 'city_palette_assets' })
export class BuildingAsset {
  @PrimaryColumn({ name: 'palette_item_id', type: 'varchar', length: 36 })
  paletteItemId: string;

  @Column({ name: 'material_id', nullable: true, length: 36 })
  materialId: string | null;

  @ManyToOne(() => CityMaterial, { nullable: true, eager: true })
  @JoinColumn({ name: 'material_id' })
  material: CityMaterial | null;

  @Column({ name: 'scale_factor', type: 'float', default: 1.0 })
  scaleFactor: number;
}
