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

  /** 0=N, 1=E, 2=S, 3=W — direção da estrada que a cidade encara. */
  @Column({ name: 'front_edge', type: 'tinyint', unsigned: true, default: 0 })
  frontEdge: number;

  /** Bioma atribuído deterministicamente via biome.util.assignBiome. */
  @Column({ name: 'biome', type: 'varchar', length: 32, default: 'plains' })
  biome: string;

  @Column({ name: 'city_level', type: 'tinyint', unsigned: true, default: 1 })
  cityLevel: number;

  @Column({ name: 'total_buildings', type: 'int', unsigned: true, default: 0 })
  totalBuildings: number;

  @Column({ name: 'ccu_limit', type: 'smallint', unsigned: true, default: 2000 })
  ccuLimit: number;

  @Column({ name: 'ccu_used', type: 'smallint', unsigned: true, default: 0 })
  ccuUsed: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
