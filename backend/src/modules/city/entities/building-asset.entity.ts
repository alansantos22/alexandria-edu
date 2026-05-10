import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { CityMaterial } from './city-material.entity';
import { CityPaletteItem } from './city-palette-item.entity';

@Entity({ name: 'city_palette_assets' })
export class BuildingAsset {
  @PrimaryColumn({ name: 'palette_item_id', type: 'varchar', length: 36 })
  paletteItemId: string;

  @OneToOne(() => CityPaletteItem, (item) => item.buildingAsset)
  @JoinColumn({ name: 'palette_item_id' })
  paletteItem: CityPaletteItem;

  @Column({ name: 'material_id', nullable: true, length: 36 })
  materialId: string | null;

  @ManyToOne(() => CityMaterial, { nullable: true, eager: true })
  @JoinColumn({ name: 'material_id' })
  material: CityMaterial | null;

  @Column({ name: 'scale_factor', type: 'float', default: 1.0 })
  scaleFactor: number;
}
