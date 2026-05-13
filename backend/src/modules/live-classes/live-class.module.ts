import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { LiveClass } from './entities/live-class.entity';
import { LiveClassAttendance } from './entities/live-class-attendance.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { LiveClassService } from './live-class.service';
import { LiveClassController, AdminLiveClassController } from './live-class.controller';
import { EnrollmentModule } from '../enrollments/enrollment.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LiveClass, LiveClassAttendance, Cohort]),
    JwtModule.register({
      secret: process.env.LIVE_CLASS_JWT_SECRET || process.env.JWT_SECRET,
      signOptions: { algorithm: 'HS256' },
    }),
    EnrollmentModule,
    NotificationModule,
  ],
  controllers: [LiveClassController, AdminLiveClassController],
  providers: [LiveClassService],
  exports: [LiveClassService],
})
export class LiveClassModule {}
