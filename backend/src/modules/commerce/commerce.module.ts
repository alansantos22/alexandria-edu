import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductCourse } from './entities/product-course.entity';
import { Campaign } from './entities/campaign.entity';
import { CampaignProduct } from './entities/campaign-product.entity';
import { Order } from './entities/order.entity';
import { PaymentIntent } from './entities/payment-intent.entity';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { VoucherUse } from '../vouchers/entities/voucher-use.entity';

import { PricingService } from './pricing.service';
import { StripeService } from './stripe.service';
import { CheckoutService } from './checkout.service';
import { CatalogService } from './catalog.service';
import { ProductAdminService } from './product-admin.service';
import { CampaignAdminService } from './campaign-admin.service';

import {
  CatalogController, CheckoutController, StripeWebhookController,
  AdminProductController, AdminCampaignController,
} from './commerce.controller';

import { CohortModule } from '../cohorts/cohort.module';
import { EnrollmentModule } from '../enrollments/enrollment.module';
import { EconomyModule } from '../economy/economy.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, ProductCourse, Campaign, CampaignProduct,
      Order, PaymentIntent, Voucher, VoucherUse,
    ]),
    CohortModule,
    EnrollmentModule,
    EconomyModule,
  ],
  controllers: [
    CatalogController, CheckoutController, StripeWebhookController,
    AdminProductController, AdminCampaignController,
  ],
  providers: [
    PricingService, StripeService, CheckoutService, CatalogService,
    ProductAdminService, CampaignAdminService,
  ],
  exports: [PricingService, CheckoutService, CatalogService],
})
export class CommerceModule {}
