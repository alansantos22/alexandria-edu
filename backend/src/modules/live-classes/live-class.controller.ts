import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { LiveClassService } from './live-class.service';
import { EnrollmentService } from '../enrollments/enrollment.service';

@Controller('live-classes')
export class LiveClassController {
  constructor(
    private readonly service: LiveClassService,
    private readonly enrollments: EnrollmentService,
  ) {}

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    const lc = await this.service.findById(id);
    if (!lc) return null;
    const enr = await this.enrollments.findActiveForLiveClassCohort(user.id, lc.cohortId);
    return this.service.toPublicView(lc, !!enr);
  }

  @Post(':id/join-token')
  joinToken(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.generateJoinToken(user.id, id);
  }

  @Public()
  @Get(':id/redirect')
  async redirect(
    @Param('id') _id: string,
    @Query('t') token: string,
    @Res() res: FastifyReply,
  ) {
    const realUrl = await this.service.resolveRedirect(token);
    res.redirect(302, realUrl);
  }
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/live-classes')
export class AdminLiveClassController {
  constructor(private readonly service: LiveClassService) {}

  @Post()
  create(@Body() body: any, @CurrentUser() admin: AuthenticatedUser) {
    const payload = {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    };
    return this.service.create(payload, admin.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const payload = {
      ...body,
      startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    };
    return this.service.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }

  @Get()
  list(@Query('from') from: string, @Query('to') to: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const toDate = to ? new Date(to) : new Date(Date.now() + 60 * 24 * 3600 * 1000);
    return this.service.listInRange(fromDate, toDate);
  }

  @Patch(':id/recording')
  setRecording(@Param('id') id: string, @Body() body: { url: string }) {
    return this.service.setRecording(id, body.url);
  }
}
