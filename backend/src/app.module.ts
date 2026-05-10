import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { throttlerConfig } from './config/throttler.config';

import { AuthModule } from './core/auth/auth.module';
import { SecurityModule } from './core/security/security.module';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ForumModule } from './modules/forum/forum.module';
import { EconomyModule }      from './modules/economy/economy.module';
import { MarketplaceModule }  from './modules/marketplace/marketplace.module';
import { CityModule }         from './modules/city/city.module';
import { ProfileModule }      from './modules/profile/profile.module';
import { LandModule }         from './modules/land/land.module';
import { AdminModule }        from './modules/admin/admin.module';
import { ContentModule }      from './modules/content/content.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthController } from './common/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({ useFactory: databaseConfig }),
    ThrottlerModule.forRootAsync({ useFactory: throttlerConfig }),
    SecurityModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    LessonsModule,
    SettingsModule,
    ForumModule,
    EconomyModule,
    MarketplaceModule,
    CityModule,
    ProfileModule,
    LandModule,
    AdminModule,
    ContentModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
