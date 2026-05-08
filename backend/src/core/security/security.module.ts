import { Module } from '@nestjs/common';
import { Argon2Service } from './argon2.service';
import { HmacService } from './hmac.service';

@Module({
  providers: [Argon2Service, HmacService],
  exports: [Argon2Service, HmacService],
})
export class SecurityModule {}
