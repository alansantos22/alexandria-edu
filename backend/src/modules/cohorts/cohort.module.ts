import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cohort } from './entities/cohort.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { CohortService } from './cohort.service';
import { CohortController, AdminCohortController } from './cohort.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cohort, Enrollment])],
  controllers: [CohortController, AdminCohortController],
  providers: [CohortService],
  exports: [CohortService],
})
export class CohortModule {}
