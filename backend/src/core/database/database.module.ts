import { Module } from '@nestjs/common';
import { MigrationRunnerService } from './migration-runner.service';

@Module({
  providers: [MigrationRunnerService],
})
export class DatabaseModule {}
