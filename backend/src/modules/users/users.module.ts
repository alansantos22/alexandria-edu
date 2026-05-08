import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { SecurityModule } from '@/core/security/security.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), SecurityModule],
  providers: [UsersRepository, UsersService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
