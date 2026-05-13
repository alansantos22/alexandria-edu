import {
  Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

export type ProductKind = 'course' | 'live_pack' | 'webinar' | 'bundle';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_PRODUCTS_SLUG', { unique: true })
  @Column({ type: 'varchar', length: 160, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl: string | null;

  @Index('IDX_PRODUCTS_KIND')
  @Column({ type: 'enum', enum: ['course', 'live_pack', 'webinar', 'bundle'], default: 'course' })
  kind: ProductKind;

  @Column({ name: 'price_brl', type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceBrl: string;

  @Column({ name: 'is_free', type: 'boolean', default: false })
  isFree: boolean;

  @Column({ name: 'allow_coins', type: 'boolean', default: false })
  allowCoins: boolean;

  @Column({ name: 'coins_max_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  coinsMaxPercent: string;

  @Column({ name: 'coins_rate', type: 'decimal', precision: 10, scale: 4, default: 1 })
  coinsRate: string;

  @Column({ name: 'access_duration_days', type: 'int', default: 365 })
  accessDurationDays: number;

  @Column({ name: 'lessons_quota', type: 'int', nullable: true })
  lessonsQuota: number | null;

  @Column({ type: 'varchar', length: 64, default: 'America/Sao_Paulo' })
  timezone: string;

  @Column({ name: 'default_capacity', type: 'int', nullable: true })
  defaultCapacity: number | null;

  @Index('IDX_PRODUCTS_PUBLISHED')
  @Column({ name: 'is_published', type: 'boolean', default: false })
  isPublished: boolean;

  @Column({ name: 'created_by', type: 'varchar', length: 36, nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
