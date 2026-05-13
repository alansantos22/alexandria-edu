import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Product } from '../commerce/entities/product.entity';
import { CalendarService } from './calendar.service';
import { CalendarController, AdminCalendarController } from './calendar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LiveClass, Cohort, Enrollment, Product])],
  controllers: [CalendarController, AdminCalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
