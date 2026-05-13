import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Voucher } from '../vouchers/entities/voucher.entity';
import { VoucherUse } from '../vouchers/entities/voucher-use.entity';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { InviteService } from './invite.service';
import { InviteController, AdminInviteController } from './invite.controller';
import { EnrollmentModule } from '../enrollments/enrollment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Voucher, VoucherUse, LiveClass, Cohort]),
    EnrollmentModule,
  ],
  controllers: [InviteController, AdminInviteController],
  providers: [InviteService],
  exports: [InviteService],
})
export class InviteModule {}
