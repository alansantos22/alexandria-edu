import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from './entities/product.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignProduct } from './entities/campaign-product.entity';
import { PricingService } from './pricing.service';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Campaign) private readonly campRepo: Repository<Campaign>,
    @InjectRepository(CampaignProduct) private readonly cpRepo: Repository<CampaignProduct>,
    private readonly pricing: PricingService,
  ) {}

  async listPublic() {
    const products = await this.productRepo.find({
      where: { isPublished: true },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(products.map(async p => {
      const price = await this.pricing.resolvePrice(p.id, null);
      return { ...p, pricing: price };
    }));
  }

  async getBySlug(slug: string) {
    const p = await this.productRepo.findOne({ where: { slug, isPublished: true } });
    if (!p) throw new NotFoundException('Produto não encontrado');
    const price = await this.pricing.resolvePrice(p.id, null);
    return { ...p, pricing: price };
  }

  async getCampaignBySlug(slug: string) {
    const campaign = await this.campRepo.findOne({ where: { publicSlug: slug, isActive: true } });
    if (!campaign) throw new NotFoundException('Promoção não encontrada');

    let productIds: string[] = [];
    if (campaign.appliesToAll) {
      const all = await this.productRepo.find({ where: { isPublished: true }, select: ['id'] });
      productIds = all.map(p => p.id);
    } else {
      const cps = await this.cpRepo.find({ where: { campaignId: campaign.id } });
      productIds = cps.map(c => c.productId);
    }
    if (productIds.length === 0) return { campaign, products: [] };

    const products = await this.productRepo.find({ where: { id: In(productIds), isPublished: true } });
    const withPrice = await Promise.all(products.map(async p => {
      const price = await this.pricing.resolvePrice(p.id, null);
      return { ...p, pricing: price };
    }));
    return { campaign, products: withPrice };
  }
}
