import { Column, CreateDateColumn, Entity, OneToOne, PrimaryColumn } from 'typeorm';
import { VehicleAsset } from './vehicle-asset.entity';

@Entity({ name: 'vehicle_catalog' })
export class VehicleCatalog {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ length: 10, default: '🚗' })
  icon: string;

  @Column({ name: 'price_coins', type: 'int', unsigned: true, default: 0 })
  priceCoins: number;

  @Column({ type: 'float', default: 5.0 })
  speed: number;

  @Column({ name: 'model_url', nullable: true, length: 512 })
  modelUrl: string | null;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'tinyint', unsigned: true, default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToOne(() => VehicleAsset, (asset) => asset.vehicle, { nullable: true, eager: true })
  vehicleAsset: VehicleAsset | null;
}
