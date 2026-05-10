import { Module }         from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';
import { Voucher }            from './entities/voucher.entity';
import { VoucherUse }         from './entities/voucher-use.entity';
import { VoucherRepository }  from './voucher.repository';
import { VoucherService }     from './voucher.service';
import { VoucherController }  from './voucher.controller';
import { AdminVoucherController } from './admin-voucher.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Voucher, VoucherUse])],
  controllers: [VoucherController, AdminVoucherController],
  providers:   [VoucherRepository, VoucherService],
  exports:     [VoucherService],
})
export class VoucherModule {}
