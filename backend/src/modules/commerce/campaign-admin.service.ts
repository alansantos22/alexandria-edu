import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { CampaignProduct } from './entities/campaign-product.entity';

@Injectable()
export class CampaignAdminService {
  constructor(
    @InjectRepository(Campaign) private readonly repo: Repository<Campaign>,
    @InjectRepository(CampaignProduct) private readonly cpRepo: Repository<CampaignProduct>,
  ) {}

  listAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Campaign>): Promise<Campaign> {
    if (!data.name) throw new BadRequestException('name obrigatório');
    if (!data.publicSlug) {
      data.publicSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 150);
    }
    const exists = await this.repo.findOne({ where: { publicSlug: data.publicSlug } });
    if (exists) data.publicSlug = `${data.publicSlug}-${Date.now()}`;
    const c = this.repo.create(data);
    return this.repo.save(c);
  }

  async update(id: string, patch: Partial<Campaign>) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Campanha não encontrada');
    Object.assign(c, patch);
    return this.repo.save(c);
  }

  async delete(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }

  async attachProduct(campaignId: string, productId: string) {
    const existing = await this.cpRepo.findOne({ where: { campaignId, productId } });
    if (existing) return existing;
    return this.cpRepo.save(this.cpRepo.create({ campaignId, productId }));
  }

  async detachProduct(campaignId: string, productId: string) {
    await this.cpRepo.delete({ campaignId, productId });
    return { ok: true };
  }
}
