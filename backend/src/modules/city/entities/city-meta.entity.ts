import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'city_meta' })
export class CityMeta {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'city_seed', type: 'varchar', length: 36 })
  citySeed: string;

  @Column({ name: 'world_x', type: 'int', default: 0 })
  worldX: number;

  @Column({ name: 'world_z', type: 'int', default: 0 })
  worldZ: number;

  @Column({ name: 'city_level', type: 'tinyint', unsigned: true, default: 1 })
  cityLevel: number;

  @Column({ name: 'total_buildings', type: 'int', unsigned: true, default: 0 })
  totalBuildings: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
