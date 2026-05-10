import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { CityMaterial } from './city-material.entity';
import { VehicleCatalog } from './vehicle-catalog.entity';

@Entity({ name: 'vehicle_assets' })
export class VehicleAsset {
  @PrimaryColumn({ name: 'vehicle_id', type: 'varchar', length: 36 })
  vehicleId: string;

  @OneToOne(() => VehicleCatalog, (v) => v.vehicleAsset)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleCatalog;

  @Column({ name: 'material_id', nullable: true, length: 36 })
  materialId: string | null;

  @ManyToOne(() => CityMaterial, { nullable: true, eager: true })
  @JoinColumn({ name: 'material_id' })
  material: CityMaterial | null;

  @Column({ name: 'scale_factor', type: 'float', default: 1.0 })
  scaleFactor: number;
}
