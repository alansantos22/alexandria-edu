import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolesGuard }        from '../../common/guards/roles.guard';
import { Roles }             from '../../common/decorators/roles.decorator';
import { CurrentUser }       from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { VoucherService }    from './voucher.service';
import { CreateVoucherDto }  from './dto/voucher.dto';

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/vouchers')
export class AdminVoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Get()
  listVouchers() {
    return this.voucherService.listVouchers();
  }

  @Post()
  createVoucher(
    @Body() dto: CreateVoucherDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    return this.voucherService.createVoucher(
      dto.label,
      dto.maxUses ?? 1,
      dto.accessDays ?? 30,
      expiresAt,
      admin.id,
    );
  }

  @Get(':id/uses')
  listUses(@Param('id') id: string) {
    return this.voucherService.listUses(id);
  }
}
