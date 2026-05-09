import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import * as path            from 'path';
import * as fs              from 'fs';

import { MarketplaceItem }     from '../marketplace/entities/marketplace-item.entity';
import { CreateBackgroundDto } from './dto/create-background.dto';
import { CreatePaletteDto }    from './dto/create-palette.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  // Pasta raiz de uploads (relativa à raiz do projeto backend)
  private readonly uploadsDir = path.resolve(process.cwd(), 'uploads', 'backgrounds');

  constructor(
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
  ) {}

  // ─── Background upload ──────────────────────────────────────────────────────

  async createBackground(
    file: { filename: string; mimetype: string; buffer: Buffer },
    dto: CreateBackgroundDto,
  ): Promise<MarketplaceItem> {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('Formato não permitido. Use JPG, PNG ou WEBP.');
    }

    if (file.buffer.byteLength > 5 * 1024 * 1024) {
      throw new BadRequestException('Imagem excede o limite de 5 MB.');
    }

    // Garantir que a pasta existe
    fs.mkdirSync(this.uploadsDir, { recursive: true });

    const ext      = file.mimetype === 'image/webp' ? 'webp'
                   : file.mimetype === 'image/png'  ? 'png' : 'jpg';
    const filename = `bg_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const dest     = path.join(this.uploadsDir, filename);

    fs.writeFileSync(dest, file.buffer);
    this.logger.log(`Background salvo: ${dest}`);

    const item = this.itemRepo.create({
      name:        dto.name,
      description: dto.description ?? null,
      type:        'wallpaper',
      imageUrl:    `/uploads/backgrounds/${filename}`,
      priceCoins:  dto.priceCoins,
      rarity:      dto.rarity,
      isActive:    1,
    });

    return this.itemRepo.save(item);
  }

  // ─── Paleta de cores ────────────────────────────────────────────────────────

  async createPalette(dto: CreatePaletteDto): Promise<MarketplaceItem> {
    const { colors, direction = '135deg' } = dto;

    let cssValue: string;

    if (colors.length === 1) {
      // Cor sólida
      cssValue = colors[0];
    } else if (direction === 'radial') {
      cssValue = `radial-gradient(circle, ${colors.join(', ')})`;
    } else {
      cssValue = `linear-gradient(${direction}, ${colors.join(', ')})`;
    }

    const imageUrl = `css:${cssValue}`;

    const item = this.itemRepo.create({
      name:        dto.name,
      description: dto.description ?? null,
      type:        'wallpaper',
      imageUrl,
      priceCoins:  dto.priceCoins,
      rarity:      dto.rarity,
      isActive:    1,
    });

    return this.itemRepo.save(item);
  }

  // ─── Criar frame CSS ────────────────────────────────────────────────────────

  async createFramePreset(dto: {
    name: string;
    description?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    priceCoins: number;
    presetKey: string;
  }): Promise<MarketplaceItem> {
    const item = this.itemRepo.create({
      name:        dto.name,
      description: dto.description ?? null,
      type:        'frame',
      imageUrl:    `frame:${dto.presetKey}`,
      priceCoins:  dto.priceCoins,
      rarity:      dto.rarity,
      isActive:    1,
    });

    return this.itemRepo.save(item);
  }

  // ─── Listar todos os itens (admin) ──────────────────────────────────────────

  listAll(): Promise<MarketplaceItem[]> {
    return this.itemRepo.find({ order: { createdAt: 'DESC' } });
  }

  // ─── Ativar/desativar item ──────────────────────────────────────────────────

  async toggleItem(id: string, active: boolean): Promise<MarketplaceItem> {
    await this.itemRepo.update(id, { isActive: active ? 1 : 0 });
    return this.itemRepo.findOneOrFail({ where: { id } });
  }
}
