import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectRepository(Setting)
    private readonly repository: Repository<Setting>,
  ) {}

  async findByKey(key: string): Promise<Setting | null> {
    return this.repository.findOne({ where: { keyName: key } });
  }

  async upsert(key: string, value: string): Promise<Setting> {
    const existing = await this.findByKey(key);
    if (existing) {
      existing.value = value;
      return this.repository.save(existing);
    }
    return this.repository.save(
      this.repository.create({ keyName: key, value }),
    );
  }
}
