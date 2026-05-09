import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Logger, ValidationPipe } from '@nestjs/common';
import fastifyCors      from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic    from '@fastify/static';
import * as path        from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 10 * 1024 * 1024, // 10 MB
    }),
  );

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  await app.register(fastifyCors as any, {
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  });

  // Multipart (upload de arquivos) — 5 MB por arquivo
  await app.register(fastifyMultipart as any, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  // Serve a pasta uploads/ como estática em /uploads/*
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  await app.register(fastifyStatic as any, {
    root:   uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api/v1', {
    exclude: [{ path: '/', method: 0 }, { path: 'health', method: 0 }],
  });

  const port = parseInt(process.env.PORT, 10) || 3003;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 Alexandria EDU API rodando em http://localhost:${port}`);
  logger.log(`📚 Endpoints em http://localhost:${port}/api/v1`);
}

bootstrap();
