import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { BuildingAsset } from './building-asset.entity';

@Entity({ name: 'city_palette' })
export class CityPaletteItem {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({
    type: 'enum',
    enum: ['residential', 'commercial', 'nature', 'road', 'decoration'],
  })
  category: 'residential' | 'commercial' | 'nature' | 'road' | 'decoration';

  @Column({ type: 'enum', enum: ['grid', 'free'] })
  placement: 'grid' | 'free';

  @Column({ name: 'ccu_cost', type: 'smallint', unsigned: true, default: 10 })
  ccuCost: number;

  @Column({ name: 'size_x', type: 'tinyint', unsigned: true, default: 1 })
  sizeX: number;

  @Column({ name: 'size_z', type: 'tinyint', unsigned: true, default: 1 })
  sizeZ: number;

  @Column({ name: 'model_url', nullable: true, length: 512 })
  modelUrl: string | null;

  @Column({ name: 'price_coins', type: 'int', unsigned: true, default: 0 })
  priceCoins: number;

  @Column({ length: 10, default: '🏠' })
  icon: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToOne(() => BuildingAsset, { nullable: true })
  buildingAsset: BuildingAsset | null;
}
