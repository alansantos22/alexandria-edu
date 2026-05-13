import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'campaign_products' })
export class CampaignProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'campaign_id', type: 'varchar', length: 36 })
  campaignId: string;

  @Column({ name: 'product_id', type: 'varchar', length: 36 })
  productId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
