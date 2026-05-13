import {
  Body, Controller, Get, Param, Post, UseGuards,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { InviteService, CreateInviteInput } from './invite.service';

@Controller('invites')
export class InviteController {
  constructor(private readonly service: InviteService) {}

  @Public()
  @Get(':code/preview')
  preview(@Param('code') code: string) {
    return this.service.preview(code);
  }

  @Post(':code/redeem')
  redeem(@Param('code') code: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.redeemAccess(user.id, code);
  }
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/invites')
export class AdminInviteController {
  constructor(private readonly service: InviteService) {}

  @Get()
  list() { return this.service.listAll(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findById(id); }

  @Get(':id/uses')
  uses(@Param('id') id: string) { return this.service.listUses(id); }

  @Post()
  create(@CurrentUser() admin: AuthenticatedUser, @Body() body: any) {
    const payload: CreateInviteInput = {
      label: body.label,
      kind: body.kind,
      scope: body.scope,
      scopeId: body.scopeId ?? null,
      maxUses: body.maxUses ?? 1,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      accessDays: body.accessDays,
      discountKind: body.discountKind,
      discountPercent: body.discountPercent,
      discountAmount: body.discountAmount,
    };
    return this.service.create(payload, admin.id);
  }
}
