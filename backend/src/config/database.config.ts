import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'alexandria_edu',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../core/database/migrations/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4_unicode_ci',
  timezone: 'Z',
});
