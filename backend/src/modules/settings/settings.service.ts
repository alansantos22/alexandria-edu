import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';

const LIVE_LINK_KEY = 'live_meeting_url';

@Injectable()
export class SettingsService {
  constructor(private readonly repo: SettingsRepository) {}

  async getLiveLink(): Promise<string> {
    const s = await this.repo.findByKey(LIVE_LINK_KEY);
    return s?.value || '';
  }

  async setLiveLink(url: string): Promise<string> {
    const saved = await this.repo.upsert(LIVE_LINK_KEY, url);
    return saved.value || '';
  }
}
