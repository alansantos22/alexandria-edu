import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query,
  Req, UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { CatalogService } from './catalog.service';
import { CheckoutService, CheckoutInput } from './checkout.service';
import { StripeService } from './stripe.service';
import { ProductAdminService } from './product-admin.service';
import { CampaignAdminService } from './campaign-admin.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Public()
  @Get()
  list() {
    return this.service.listPublic();
  }

  @Public()
  @Get(':slug')
  bySlug(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }

  @Public()
  @Get('promo/:slug')
  promo(@Param('slug') slug: string) {
    return this.service.getCampaignBySlug(slug);
  }
}

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkout: CheckoutService) {}

  @Post('quote')
  quote(@CurrentUser() user: AuthenticatedUser, @Body() body: CheckoutInput) {
    return this.checkout.quote(user.id, body);
  }

  @Post('start')
  start(@CurrentUser() user: AuthenticatedUser, @Body() body: CheckoutInput) {
    return this.checkout.start(user.id, body);
  }
}

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(
    private readonly stripe: StripeService,
    private readonly checkout: CheckoutService,
  ) {}

  @Public()
  @Post()
  async handle(@Req() req: FastifyRequest) {
    const signature = (req.headers['stripe-signature'] || '') as string;
    if (!signature) throw new BadRequestException('Stripe signature ausente');
    const raw = (req as any).rawBody || JSON.stringify(req.body);
    let event: any;
    try {
      event = this.stripe.verifyWebhookSignature(raw, signature);
    } catch (err) {
      throw new BadRequestException(`Webhook inválido: ${(err as Error).message}`);
    }
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.checkout.fulfillPaidOrder(event.data.object.id, event);
        break;
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await this.checkout.failOrder(event.data.object.id, event);
        break;
    }
    return { received: true };
  }
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/products')
export class AdminProductController {
  constructor(private readonly service: ProductAdminService) {}

  @Get() list() { return this.service.listAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() body: any) {
    return this.service.create({ ...body, createdBy: admin.id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.delete(id); }

  @Post(':id/courses')
  attachCourse(@Param('id') id: string, @Body() body: { courseId: string }) {
    return this.service.attachCourse(id, body.courseId);
  }

  @Delete(':id/courses/:courseId')
  detachCourse(@Param('id') id: string, @Param('courseId') courseId: string) {
    return this.service.detachCourse(id, courseId);
  }
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/campaigns')
export class AdminCampaignController {
  constructor(private readonly service: CampaignAdminService) {}

  @Get() list() { return this.service.listAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() body: any) {
    return this.service.create({ ...body, createdBy: admin.id });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.delete(id); }

  @Post(':id/products')
  attachProduct(@Param('id') id: string, @Body() body: { productId: string }) {
    return this.service.attachProduct(id, body.productId);
  }

  @Delete(':id/products/:productId')
  detachProduct(@Param('id') id: string, @Param('productId') productId: string) {
    return this.service.detachProduct(id, productId);
  }
}
