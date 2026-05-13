import { Injectable, Logger } from '@nestjs/common';

/**
 * Stripe wrapper — lazy load. Se STRIPE_SECRET_KEY não está set, métodos retornam erro descritivo
 * permitindo que o resto do backend funcione sem Stripe configurado (modo dev sem pagamento).
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private client: any = null;
  private webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      this.logger.warn('STRIPE_SECRET_KEY não configurada — modo dev sem Stripe ativo.');
      return;
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Stripe = require('stripe');
      this.client = new Stripe(key, { apiVersion: '2024-06-20' });
    } catch (err) {
      this.logger.error(`Falha ao carregar Stripe SDK: ${(err as Error).message}`);
    }
  }

  isEnabled(): boolean { return !!this.client; }

  async createPaymentIntent(params: {
    amountBrlCents: number;
    metadata: Record<string, string>;
    description?: string;
  }) {
    if (!this.client) {
      throw new Error('Stripe não configurado (defina STRIPE_SECRET_KEY)');
    }
    return this.client.paymentIntents.create({
      amount: params.amountBrlCents,
      currency: 'brl',
      automatic_payment_methods: { enabled: true },
      metadata: params.metadata,
      description: params.description,
    });
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): any {
    if (!this.client) throw new Error('Stripe não configurado');
    if (!this.webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET não configurado');
    return this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
  }
}
