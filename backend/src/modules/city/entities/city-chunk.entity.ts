import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'city_chunks' })
@Index('UK_CHUNK_POS', ['userId', 'chunkX', 'chunkZ'], { unique: true })
export class CityChunk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_CHUNK_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Column({ name: 'chunk_x', type: 'smallint' })
  chunkX: number;

  @Column({ name: 'chunk_z', type: 'smallint' })
  chunkZ: number;

  /** Hex-encoded 16×16 grid. One hex char = one cell type (0–F). */
  @Column({ name: 'data_hex', type: 'varchar', length: 512, default: '' })
  dataHex: string;

  @Column({ name: 'version', type: 'int', unsigned: true, default: 1 })
  version: number;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
