import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { CityPaletteItem } from './city-palette-item.entity';

@Entity({ name: 'city_buildings' })
export class CityBuilding {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ name: 'city_user_id', type: 'varchar', length: 36 })
  cityUserId: string;

  @Column({ name: 'palette_item_id', type: 'varchar', length: 36 })
  paletteItemId: string;

  @ManyToOne(() => CityPaletteItem, { eager: true })
  @JoinColumn({ name: 'palette_item_id' })
  paletteItem: CityPaletteItem;

  @Column({ name: 'grid_x', type: 'smallint' })
  gridX: number;

  @Column({ name: 'grid_z', type: 'smallint' })
  gridZ: number;

  @Column({ type: 'smallint', unsigned: true, default: 0 })
  rotation: number;

  @CreateDateColumn({ name: 'placed_at', type: 'timestamp' })
  placedAt: Date;
}
