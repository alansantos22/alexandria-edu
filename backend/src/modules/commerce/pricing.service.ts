import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { Product } from './entities/product.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignProduct } from './entities/campaign-product.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';

export interface PriceBreakdown {
  productId: string;
  listPriceBrl: number;
  discountBrl: number;
  discountSource: 'none' | 'campaign' | 'voucher';
  campaignId: string | null;
  voucherCode: string | null;
  /** Preço efetivo em BRL após desconto (antes de aplicar moedas) */
  effectivePriceBrl: number;
  /** Máximo permitido em moedas (BRL convertido) */
  maxCoinsValueBrl: number;
  coinsRate: number;
  allowCoins: boolean;
  isFree: boolean;
  badge: string | null;
}

@Injectable()
export class PricingService {
  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Campaign) private readonly campRepo: Repository<Campaign>,
    @InjectRepository(CampaignProduct) private readonly cpRepo: Repository<CampaignProduct>,
    @InjectRepository(Voucher) private readonly voucherRepo: Repository<Voucher>,
  ) {}

  /** Lista campanhas ativas no momento */
  async getActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return this.campRepo
      .createQueryBuilder('c')
      .where('c.is_active = TRUE')
      .andWhere('(c.starts_at IS NULL OR c.starts_at <= :now)', { now })
      .andWhere('(c.ends_at IS NULL OR c.ends_at >= :now)', { now })
      .getMany();
  }

  /** Retorna mapa productId → melhor campanha ativa */
  async getActiveCampaignByProduct(): Promise<Map<string, Campaign>> {
    const campaigns = await this.getActiveCampaigns();
    if (campaigns.length === 0) return new Map();

    const result = new Map<string, Campaign>();
    const allProducts = campaigns.filter(c => c.appliesToAll);

    const targeted = campaigns.filter(c => !c.appliesToAll);
    const cps = targeted.length
      ? await this.cpRepo.find({ where: { campaignId: In(targeted.map(c => c.id)) } })
      : [];

    const byCampaign: Record<string, string[]> = {};
    for (const cp of cps) {
      (byCampaign[cp.campaignId] ||= []).push(cp.productId);
    }

    const allProductIds = new Set<string>(cps.map(cp => cp.productId));
    if (allProducts.length > 0) {
      const allDbProducts = await this.productRepo.find({ select: ['id'] });
      allDbProducts.forEach(p => allProductIds.add(p.id));
    }

    for (const pid of allProductIds) {
      let best: Campaign | null = null;
      let bestDiscount = -1;
      for (const c of campaigns) {
        const applies = c.appliesToAll || (byCampaign[c.id] || []).includes(pid);
        if (!applies) continue;
        const product = await this.productRepo.findOne({ where: { id: pid } });
        if (!product) continue;
        const d = this.campaignDiscount(c, parseFloat(product.priceBrl));
        if (d > bestDiscount) { bestDiscount = d; best = c; }
      }
      if (best) result.set(pid, best);
    }
    return result;
  }

  private campaignDiscount(c: Campaign, listPrice: number): number {
    if (c.kind === 'percent') return listPrice * (parseFloat(c.discountPercent) / 100);
    return Math.min(parseFloat(c.discountAmount), listPrice);
  }

  private voucherDiscount(v: Voucher, listPrice: number): number {
    if (v.kind !== 'discount') return 0;
    if (v.discountKind === 'percent') return listPrice * (parseFloat(v.discountPercent) / 100);
    if (v.discountKind === 'fixed')   return Math.min(parseFloat(v.discountAmount), listPrice);
    return 0;
  }

  /**
   * Resolve preço efetivo. Regra: cupom OU campanha — o MAIOR vence. Nunca acumula.
   */
  async resolvePrice(productId: string, voucherCode?: string | null): Promise<PriceBreakdown> {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new Error('Produto não encontrado');

    const listPrice = parseFloat(product.priceBrl);

    let campaignDisc = 0;
    let campaignRef: Campaign | null = null;
    const camps = await this.getActiveCampaignByProduct();
    const camp = camps.get(productId);
    if (camp) {
      campaignDisc = this.campaignDiscount(camp, listPrice);
      campaignRef = camp;
    }

    let voucherDisc = 0;
    let voucherRef: Voucher | null = null;
    if (voucherCode) {
      const v = await this.voucherRepo.findOne({ where: { code: voucherCode.toUpperCase() } });
      if (v && v.kind === 'discount' && v.currentUses < v.maxUses) {
        const expired = v.expiresAt && v.expiresAt < new Date();
        const scopeOk = v.scope === 'global' || (v.scope === 'product' && v.scopeId === productId);
        if (!expired && scopeOk) {
          voucherDisc = this.voucherDiscount(v, listPrice);
          voucherRef = v;
        }
      }
    }

    let finalDiscount = 0;
    let source: PriceBreakdown['discountSource'] = 'none';
    let campaignId: string | null = null;
    let voucherCodeOut: string | null = null;
    if (voucherDisc > campaignDisc && voucherDisc > 0) {
      finalDiscount = voucherDisc;
      source = 'voucher';
      voucherCodeOut = voucherRef!.code;
    } else if (campaignDisc > 0) {
      finalDiscount = campaignDisc;
      source = 'campaign';
      campaignId = campaignRef!.id;
    }

    const effective = Math.max(0, listPrice - finalDiscount);
    const maxCoinsValue = product.allowCoins
      ? effective * (parseFloat(product.coinsMaxPercent) / 100)
      : 0;

    return {
      productId,
      listPriceBrl: round2(listPrice),
      discountBrl: round2(finalDiscount),
      discountSource: source,
      campaignId,
      voucherCode: voucherCodeOut,
      effectivePriceBrl: round2(effective),
      maxCoinsValueBrl: round2(maxCoinsValue),
      coinsRate: parseFloat(product.coinsRate),
      allowCoins: product.allowCoins,
      isFree: product.isFree || effective <= 0.005,
      badge: campaignRef?.badgeText ?? null,
    };
  }
}

function round2(n: number) { return Math.round(n * 100) / 100; }
