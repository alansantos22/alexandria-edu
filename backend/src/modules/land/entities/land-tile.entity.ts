import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm'

@Entity({ name: 'land_tiles' })
@Unique('UK_LAND_TILE', ['cityUserId', 'tileX', 'tileZ'])
export class LandTile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index('IDX_LAND_TILE_CITY')
  @Column({ name: 'city_user_id', type: 'varchar', length: 36 })
  cityUserId: string

  @Column({ name: 'tile_x', type: 'tinyint', unsigned: true })
  tileX: number

  @Column({ name: 'tile_z', type: 'tinyint', unsigned: true })
  tileZ: number

  @CreateDateColumn({ name: 'purchased_at', type: 'timestamp' })
  purchasedAt: Date
}
