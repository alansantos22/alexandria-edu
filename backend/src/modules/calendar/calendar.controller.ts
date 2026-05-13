import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { CalendarService } from './calendar.service';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const toDate = to ? new Date(to) : new Date(Date.now() + 60 * 24 * 3600 * 1000);
    return this.service.listForUser(user.id, fromDate, toDate);
  }
}

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/calendar')
export class AdminCalendarController {
  constructor(private readonly service: CalendarService) {}

  @Get()
  list(@Query('from') from: string, @Query('to') to: string) {
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const toDate = to ? new Date(to) : new Date(Date.now() + 90 * 24 * 3600 * 1000);
    return this.service.listAll(fromDate, toDate);
  }
}
