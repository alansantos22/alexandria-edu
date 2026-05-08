import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { jwtConfig } from '@/config/jwt.config';
import { SecurityModule } from '@/core/security/security.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
  imports: [
    JwtModule.registerAsync({ useFactory: jwtConfig }),
    SecurityModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
