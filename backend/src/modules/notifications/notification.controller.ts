import {
  Body, Controller, Get, Param, Patch, Post,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { NotificationService } from './notification.service';

@Controller('me/notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async list(@CurrentUser() user: AuthenticatedUser) {
    const [items, unread] = await Promise.all([
      this.service.list(user.id),
      this.service.unreadCount(user.id),
    ]);
    return { items, unread };
  }

  @Get('preferences')
  preferences(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getPreference(user.id);
  }

  @Patch('preferences')
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() patch: any) {
    return this.service.updatePreference(user.id, patch);
  }

  @Patch(':id/read')
  async markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.service.markRead(user.id, id);
    return { ok: true };
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    await this.service.markAllRead(user.id);
    return { ok: true };
  }
}
