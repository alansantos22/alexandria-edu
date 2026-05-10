import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'city_materials' })
export class CityMaterial {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ name: 'texture_albedo', nullable: true, length: 512 })
  textureAlbedo: string | null;

  @Column({ name: 'texture_normal', nullable: true, length: 512 })
  textureNormal: string | null;

  @Column({ name: 'texture_roughness_metalness', nullable: true, length: 512 })
  textureRoughnessMetalness: string | null;

  @Column({ name: 'texture_ao', nullable: true, length: 512 })
  textureAo: string | null;

  @Column({ name: 'texture_emissive', nullable: true, length: 512 })
  textureEmissive: string | null;

  @Column({ type: 'float', default: 0.7 })
  roughness: number;

  @Column({ type: 'float', default: 0.0 })
  metalness: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
