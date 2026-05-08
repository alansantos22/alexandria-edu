import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateLiveLinkDto } from './dto/update-live-link.dto';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Public } from '@/common/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('live-link')
  @Public()
  async getLiveLink() {
    const url = await this.settingsService.getLiveLink();
    return { url };
  }

  @Put('live-link')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateLiveLink(@Body() dto: UpdateLiveLinkDto) {
    const url = await this.settingsService.setLiveLink(dto.link || '');
    return { success: true, url };
  }
}
