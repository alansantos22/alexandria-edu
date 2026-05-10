import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser }       from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { VoucherService }    from './voucher.service';
import { RedeemVoucherDto }  from './dto/voucher.dto';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  /** Aluno resgata um voucher de acesso */
  @Post('redeem')
  redeem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RedeemVoucherDto,
  ) {
    return this.voucherService.redeemVoucher(user.id, dto.code);
  }
}
