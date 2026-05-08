import { Controller, Get } from '@nestjs/common';
import { Public } from '../decorators/public.decorator';

@Controller()
export class HealthController {
  @Get()
  @Public()
  root() {
    return { service: 'alexandria-edu-api', status: 'ok' };
  }

  @Get('health')
  @Public()
  health() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
