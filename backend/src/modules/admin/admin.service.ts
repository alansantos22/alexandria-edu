import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import * as path            from 'path';
import * as fs              from 'fs';
import { randomUUID }       from 'crypto';

import { MarketplaceItem }     from '../marketplace/entities/marketplace-item.entity';
import { CityPaletteItem }     from '../city/entities/city-palette-item.entity';
import { BuildingAsset }       from '../city/entities/building-asset.entity';
import { CreateBackgroundDto } from './dto/create-background.dto';
import { CreatePaletteDto }    from './dto/create-palette.dto';
import { CreateBuildingDto }   from './dto/create-building.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  private readonly uploadsDir = path.resolve(process.cwd(), 'uploads', 'backgrounds');

  constructor(
    @InjectRepository(MarketplaceItem)
    private readonly itemRepo: Repository<MarketplaceItem>,
    @InjectRepository(CityPaletteItem)
    private readonly paletteItemRepo: Repository<CityPaletteItem>,
    @InjectRepository(BuildingAsset)
    private readonly buildingAssetRepo: Repository<BuildingAsset>,
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

    if (isNaN(dto.priceCoins) || dto.priceCoins < 0) {
      throw new BadRequestException('priceCoins deve ser um número válido e não-negativo.');
    }

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
    const paletteData = {
      primary:       dto.primary,
      primaryDark:   dto.primaryDark,
      secondary:     dto.secondary,
      secondaryDark: dto.secondaryDark,
      tertiary:      dto.tertiary,
    };

    const imageUrl = `palette:${JSON.stringify(paletteData)}`;

    const item = this.itemRepo.create({
      name:        dto.name,
      description: dto.description ?? null,
      type:        'palette',
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

  // ─── Criar building 3D ─────────────────────────────────────────────────────

  async createBuilding(
    files: Record<string, { filename: string; mimetype: string; buffer: Buffer }>,
    dto: CreateBuildingDto,
  ): Promise<CityPaletteItem> {
    const modelFile = files['model'];
    if (!modelFile) throw new BadRequestException('Arquivo model (GLB) é obrigatório.');

    const modelsDir = path.resolve(process.cwd(), 'uploads', 'models');
    fs.mkdirSync(modelsDir, { recursive: true });

    const modelFilename = `model_${Date.now()}_${Math.random().toString(36).slice(2)}.glb`;
    fs.writeFileSync(path.join(modelsDir, modelFilename), modelFile.buffer);
    this.logger.log(`Modelo GLB salvo: ${modelFilename}`);

    const texturesDir = path.resolve(process.cwd(), 'uploads', 'textures');
    fs.mkdirSync(texturesDir, { recursive: true });

    const saveTexture = (fieldname: string): string | null => {
      const f = files[fieldname];
      if (!f) return null;
      const ext = f.filename.split('.').pop()?.toLowerCase() || 'png';
      const fn  = `tex_${fieldname}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      fs.writeFileSync(path.join(texturesDir, fn), f.buffer);
      return `/uploads/textures/${fn}`;
    };

    const id = randomUUID();

    const paletteItem = this.paletteItemRepo.create({
      id,
      name:       dto.name,
      category:   dto.category,
      placement:  dto.placement,
      ccuCost:    dto.ccuCost,
      sizeX:      dto.sizeX,
      sizeZ:      dto.sizeZ,
      priceCoins: dto.priceCoins,
      icon:       dto.icon || '🏠',
      modelUrl:   `/uploads/models/${modelFilename}`,
      isActive:   true,
    });
    await this.paletteItemRepo.save(paletteItem);

    const asset = this.buildingAssetRepo.create({
      paletteItemId:              id,
      textureAlbedo:              saveTexture('texAlbedo'),
      textureNormal:              saveTexture('texNormal'),
      textureRoughnessMetalness:  saveTexture('texRoughnessMetalness'),
      textureAo:                  saveTexture('texAo'),
      roughness:                  dto.roughness   ?? 0.7,
      metalness:                  dto.metalness   ?? 0.0,
      scaleFactor:                dto.scaleFactor ?? 1.0,
    });
    await this.buildingAssetRepo.save(asset);

    return this.paletteItemRepo.findOne({ where: { id }, relations: ['buildingAsset'] });
  }

  // ─── Listar todos os itens (admin) ──────────────────────────────────────────

  listAll(): Promise<MarketplaceItem[]> {
    return this.itemRepo.find({ order: { createdAt: 'DESC' } });
  }

  listBuildings(): Promise<CityPaletteItem[]> {
    return this.paletteItemRepo.find({
      relations: ['buildingAsset'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Ativar/desativar item ──────────────────────────────────────────────────

  async toggleItem(id: string, active: boolean): Promise<MarketplaceItem> {
    await this.itemRepo.update(id, { isActive: active ? 1 : 0 });
    return this.itemRepo.findOneOrFail({ where: { id } });
  }

  async toggleBuilding(id: string, active: boolean): Promise<CityPaletteItem> {
    await this.paletteItemRepo.update(id, { isActive: active as any });
    return this.paletteItemRepo.findOneOrFail({ where: { id }, relations: ['buildingAsset'] });
  }
}
