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
import { CityMaterial }        from '../city/entities/city-material.entity';
import { CreateBackgroundDto } from './dto/create-background.dto';
import { CreatePaletteDto }    from './dto/create-palette.dto';
import { CreateBuildingDto }   from './dto/create-building.dto';

type FileMap = Record<string, { filename: string; mimetype: string; buffer: Buffer }>;

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
    @InjectRepository(CityMaterial)
    private readonly materialRepo: Repository<CityMaterial>,
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
    fs.writeFileSync(path.join(this.uploadsDir, filename), file.buffer);
    this.logger.log(`Background salvo: ${filename}`);

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
      primary: dto.primary, primaryDark: dto.primaryDark,
      secondary: dto.secondary, secondaryDark: dto.secondaryDark,
      tertiary: dto.tertiary,
    };
    const item = this.itemRepo.create({
      name: dto.name, description: dto.description ?? null,
      type: 'palette', imageUrl: `palette:${JSON.stringify(paletteData)}`,
      priceCoins: dto.priceCoins, rarity: dto.rarity, isActive: 1,
    });
    return this.itemRepo.save(item);
  }

  // ─── Frame CSS ──────────────────────────────────────────────────────────────

  async createFramePreset(dto: {
    name: string; description?: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    priceCoins: number; presetKey: string;
  }): Promise<MarketplaceItem> {
    const item = this.itemRepo.create({
      name: dto.name, description: dto.description ?? null,
      type: 'frame', imageUrl: `frame:${dto.presetKey}`,
      priceCoins: dto.priceCoins, rarity: dto.rarity, isActive: 1,
    });
    return this.itemRepo.save(item);
  }

  // ─── Material 3D ───────────────────────────────────────────────────────────

  private _texturesDir = path.resolve(process.cwd(), 'uploads', 'textures');

  private _saveTexture(files: FileMap, fieldname: string): string | null {
    const f = files[fieldname];
    if (!f) return null;
    fs.mkdirSync(this._texturesDir, { recursive: true });
    const ext = f.filename.split('.').pop()?.toLowerCase() || 'png';
    const fn  = `tex_${fieldname}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    fs.writeFileSync(path.join(this._texturesDir, fn), f.buffer);
    return `/uploads/textures/${fn}`;
  }

  async createMaterial(
    files: FileMap,
    dto: { name: string; roughness?: number; metalness?: number; albedoColorSpace?: string; flipY?: boolean },
  ): Promise<CityMaterial> {
    const material = this.materialRepo.create({
      id:                        randomUUID(),
      name:                      dto.name,
      textureAlbedo:             this._saveTexture(files, 'texAlbedo'),
      textureNormal:             this._saveTexture(files, 'texNormal'),
      textureRoughnessMetalness: this._saveTexture(files, 'texRoughnessMetalness'),
      textureAo:                 this._saveTexture(files, 'texAo'),
      textureEmissive:           this._saveTexture(files, 'texEmissive'),
      roughness:                 dto.roughness ?? 0.7,
      metalness:                 dto.metalness ?? 0.0,
      albedoColorSpace:          dto.albedoColorSpace ?? 'srgb',
      flipY:                     dto.flipY ?? false,
    });
    return this.materialRepo.save(material);
  }

  async updateMaterial(
    id: string,
    files: FileMap,
    dto: { name?: string; roughness?: number; metalness?: number; albedoColorSpace?: string; flipY?: boolean },
  ): Promise<CityMaterial> {
    const material = await this.materialRepo.findOneBy({ id });
    if (!material) throw new BadRequestException(`Material ${id} não encontrado.`);

    if (dto.name             !== undefined) material.name             = dto.name;
    if (dto.roughness        !== undefined) material.roughness        = dto.roughness;
    if (dto.metalness        !== undefined) material.metalness        = dto.metalness;
    if (dto.albedoColorSpace !== undefined) material.albedoColorSpace = dto.albedoColorSpace;
    if (dto.flipY            !== undefined) material.flipY            = dto.flipY;

    const newAlbedo  = this._saveTexture(files, 'texAlbedo');
    const newNormal  = this._saveTexture(files, 'texNormal');
    const newRm      = this._saveTexture(files, 'texRoughnessMetalness');
    const newAo      = this._saveTexture(files, 'texAo');
    const newEmissive = this._saveTexture(files, 'texEmissive');

    if (newAlbedo)   material.textureAlbedo             = newAlbedo;
    if (newNormal)   material.textureNormal              = newNormal;
    if (newRm)       material.textureRoughnessMetalness  = newRm;
    if (newAo)       material.textureAo                  = newAo;
    if (newEmissive) material.textureEmissive             = newEmissive;

    return this.materialRepo.save(material);
  }

  listMaterials(): Promise<CityMaterial[]> {
    return this.materialRepo.find({ order: { createdAt: 'DESC' } });
  }

  // ─── Building 3D ───────────────────────────────────────────────────────────

  async createBuilding(
    files: FileMap,
    dto: CreateBuildingDto,
  ): Promise<CityPaletteItem> {
    const modelFile = files['model'];
    if (!modelFile) throw new BadRequestException('Arquivo model (GLB) é obrigatório.');

    const modelsDir = path.resolve(process.cwd(), 'uploads', 'models');
    fs.mkdirSync(modelsDir, { recursive: true });

    const modelFilename = `model_${Date.now()}_${Math.random().toString(36).slice(2)}.glb`;
    fs.writeFileSync(path.join(modelsDir, modelFilename), modelFile.buffer);
    this.logger.log(`Modelo GLB salvo: ${modelFilename}`);

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
      paletteItemId: id,
      materialId:    dto.materialId ?? null,
      scaleFactor:   dto.scaleFactor ?? 1.0,
    });
    await this.buildingAssetRepo.save(asset);

    return this.paletteItemRepo.findOne({ where: { id }, relations: ['buildingAsset', 'buildingAsset.material'] });
  }

  listBuildings(): Promise<CityPaletteItem[]> {
    return this.paletteItemRepo.find({
      relations: ['buildingAsset', 'buildingAsset.material'],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── Marketplace list / toggle ──────────────────────────────────────────────

  listAll(): Promise<MarketplaceItem[]> {
    return this.itemRepo.find({ order: { createdAt: 'DESC' } });
  }

  async toggleItem(id: string, active: boolean): Promise<MarketplaceItem> {
    await this.itemRepo.update(id, { isActive: active ? 1 : 0 });
    return this.itemRepo.findOneOrFail({ where: { id } });
  }

  async toggleBuilding(id: string, active: boolean): Promise<CityPaletteItem> {
    await this.paletteItemRepo.update(id, { isActive: active as any });
    return this.paletteItemRepo.findOneOrFail({ where: { id }, relations: ['buildingAsset', 'buildingAsset.material'] });
  }
}
