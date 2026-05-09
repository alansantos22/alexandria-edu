import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

const boolTransformer = {
  to: (val: boolean) => val,
  from: (val: unknown): boolean => val === true || val === 1 || val === '1',
};

@Entity({ name: 'user_vehicles' })
@Index('UK_VEHICLE_TYPE', ['userId', 'vehicleType'], { unique: true })
export class UserVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_VEHICLE_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'vehicle_type', type: 'varchar', length: 50 })
  vehicleType: string;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 0, transformer: boolTransformer })
  isActive: boolean;

  @CreateDateColumn({ name: 'purchased_at', type: 'timestamp' })
  purchasedAt: Date;
}
