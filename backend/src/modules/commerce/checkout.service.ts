import {
  BadRequestException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { VoucherUse } from '../vouchers/entities/voucher-use.entity';
import { PricingService } from './pricing.service';
import { StripeService } from './stripe.service';
import { CohortService } from '../cohorts/cohort.service';
import { EnrollmentService } from '../enrollments/enrollment.service';
import { EconomyService } from '../economy/economy.service';

export interface CheckoutInput {
  productId: string;
  cohortId?: string;
  voucherCode?: string | null;
  coinsToUse?: number;
}

export interface CheckoutQuote {
  productId: string;
  listPriceBrl: number;
  discountBrl: number;
  voucherCode: string | null;
  campaignId: string | null;
  coinsToUse: number;
  coinsValueBrl: number;
  brlToPay: number;
  allowCoins: boolean;
  maxCoinsValueBrl: number;
  coinsRate: number;
  isFree: boolean;
}

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(PaymentIntent) private readonly piRepo: Repository<PaymentIntent>,
    @InjectRepository(Voucher) private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherUse) private readonly voucherUseRepo: Repository<VoucherUse>,
    private readonly pricing: PricingService,
    private readonly stripe: StripeService,
    private readonly cohorts: CohortService,
    private readonly enrollments: EnrollmentService,
    private readonly economy: EconomyService,
    private readonly dataSource: DataSource,
  ) {}

  async quote(userId: string, input: CheckoutInput): Promise<CheckoutQuote> {
    const product = await this.productRepo.findOne({ where: { id: input.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    const price = await this.pricing.resolvePrice(input.productId, input.voucherCode ?? null);

    let coinsToUse = input.coinsToUse ?? 0;
    if (coinsToUse < 0) coinsToUse = 0;

    let coinsValueBrl = 0;
    if (coinsToUse > 0) {
      if (!product.allowCoins) {
        throw new BadRequestException('Este produto não aceita pagamento em moedas.');
      }
      const userBalance = (await this.economy.getBalance(userId)).balance;
      if (coinsToUse > userBalance) {
        throw new BadRequestException('Saldo de moedas insuficiente.');
      }
      coinsValueBrl = coinsToUse / parseFloat(product.coinsRate);
      if (coinsValueBrl > price.maxCoinsValueBrl + 0.005) {
        throw new BadRequestException(`Valor em moedas excede o máximo de R$ ${price.maxCoinsValueBrl.toFixed(2)}.`);
      }
    }

    const brlToPay = Math.max(0, round2(price.effectivePriceBrl - coinsValueBrl));

    return {
      productId: input.productId,
      listPriceBrl: price.listPriceBrl,
      discountBrl: price.discountBrl,
      voucherCode: price.voucherCode,
      campaignId: price.campaignId,
      coinsToUse,
      coinsValueBrl: round2(coinsValueBrl),
      brlToPay,
      allowCoins: price.allowCoins,
      maxCoinsValueBrl: price.maxCoinsValueBrl,
      coinsRate: price.coinsRate,
      isFree: price.isFree && coinsToUse === 0,
    };
  }

  /**
   * Inicia checkout. Se brlToPay > 0, cria PaymentIntent no Stripe e retorna client_secret.
   * Se for grátis (campanha 100% / moedas cobrindo tudo), libera enrollment imediatamente.
   */
  async start(userId: string, input: CheckoutInput): Promise<{
    orderId: string;
    status: string;
    clientSecret?: string;
    requiresStripe: boolean;
    enrollmentId?: string;
  }> {
    const product = await this.productRepo.findOne({ where: { id: input.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');
    if (!product.isPublished) throw new BadRequestException('Produto indisponível.');

    let cohortId = input.cohortId ?? null;
    if (cohortId) await this.cohorts.assertAvailable(cohortId);

    const quote = await this.quote(userId, input);
    const price = await this.pricing.resolvePrice(input.productId, input.voucherCode ?? null);

    // Criar order
    const order = this.orderRepo.create({
      userId,
      productId: input.productId,
      cohortId,
      listPriceBrl: String(quote.listPriceBrl),
      discountBrl: String(quote.discountBrl),
      coinsUsed: quote.coinsToUse,
      coinsValueBrl: String(quote.coinsValueBrl),
      brlToPay: String(quote.brlToPay),
      voucherCode: quote.voucherCode,
      campaignId: quote.campaignId,
      status: 'pending',
      paymentMethod: quote.brlToPay > 0 ? 'stripe' : (quote.coinsToUse > 0 ? 'coins_only' : 'free'),
    });
    const savedOrder = await this.orderRepo.save(order);

    // Caso grátis ou só-moedas
    if (quote.brlToPay <= 0.005) {
      await this.dataSource.transaction(async em => {
        if (quote.coinsToUse > 0) {
          // Debita moedas
          const r = await this.economy.spendCoins(
            userId, quote.coinsToUse, savedOrder.id,
            `Compra do produto ${product.name}`,
          );
          if (!r.success) throw new BadRequestException('Saldo de moedas insuficiente.');
        }
        // Marcar order como paga
        await em.update(Order, savedOrder.id, {
          status: 'paid',
          paidAt: new Date(),
        });
        // Consumir voucher de desconto (se foi)
        if (quote.voucherCode && price.discountSource === 'voucher') {
          const v = await this.voucherRepo.findOne({ where: { code: quote.voucherCode } });
          if (v) {
            await em.increment(Voucher, { id: v.id }, 'currentUses', 1);
            await em.save(VoucherUse, em.create(VoucherUse, { voucherId: v.id, userId }));
          }
        }
      });
      const enrollment = await this.enrollments.grant({
        userId,
        productId: input.productId,
        cohortId,
        source: 'purchase',
        sourceRef: savedOrder.id,
      });
      return {
        orderId: savedOrder.id,
        status: 'paid',
        requiresStripe: false,
        enrollmentId: enrollment.id,
      };
    }

    // Caso Stripe
    if (!this.stripe.isEnabled()) {
      throw new BadRequestException('Pagamento em BRL indisponível (Stripe não configurado).');
    }
    const pi = await this.stripe.createPaymentIntent({
      amountBrlCents: Math.round(quote.brlToPay * 100),
      metadata: { orderId: savedOrder.id, userId, productId: input.productId },
      description: `Compra: ${product.name}`,
    });
    await this.piRepo.save(this.piRepo.create({
      orderId: savedOrder.id,
      stripePiId: pi.id,
      clientSecret: pi.client_secret,
      status: pi.status,
      amountBrl: String(quote.brlToPay),
    }));
    await this.orderRepo.update(savedOrder.id, { status: 'awaiting_payment' });

    return {
      orderId: savedOrder.id,
      status: 'awaiting_payment',
      requiresStripe: true,
      clientSecret: pi.client_secret,
    };
  }

  /** Chamado pelo webhook do Stripe quando payment_intent.succeeded */
  async fulfillPaidOrder(stripePiId: string, lastEvent: any) {
    const pi = await this.piRepo.findOne({ where: { stripePiId } });
    if (!pi) {
      this.logger.warn(`PaymentIntent ${stripePiId} não encontrado.`);
      return;
    }
    await this.piRepo.update(pi.id, {
      status: 'succeeded',
      lastEvent: lastEvent.type,
      rawLastEvent: lastEvent,
    });

    const order = await this.orderRepo.findOne({ where: { id: pi.orderId } });
    if (!order || order.status === 'paid') return;

    await this.dataSource.transaction(async em => {
      // Debita moedas (se houver)
      if (order.coinsUsed > 0) {
        const r = await this.economy.spendCoins(
          order.userId, order.coinsUsed, order.id, `Compra (order ${order.id})`,
        );
        if (!r.success) {
          this.logger.error(`Falha debitando moedas para order ${order.id}`);
        }
      }
      await em.update(Order, order.id, { status: 'paid', paidAt: new Date() });
      if (order.voucherCode) {
        const v = await this.voucherRepo.findOne({ where: { code: order.voucherCode } });
        if (v && v.kind === 'discount') {
          await em.increment(Voucher, { id: v.id }, 'currentUses', 1);
          await em.save(VoucherUse, em.create(VoucherUse, { voucherId: v.id, userId: order.userId }));
        }
      }
    });

    await this.enrollments.grant({
      userId: order.userId,
      productId: order.productId,
      cohortId: order.cohortId,
      source: 'purchase',
      sourceRef: order.id,
    });
  }

  async failOrder(stripePiId: string, lastEvent: any) {
    const pi = await this.piRepo.findOne({ where: { stripePiId } });
    if (!pi) return;
    await this.piRepo.update(pi.id, { status: 'failed', lastEvent: lastEvent.type, rawLastEvent: lastEvent });
    await this.orderRepo.update(pi.orderId, { status: 'failed' });
  }
}

function round2(n: number) { return Math.round(n * 100) / 100; }
