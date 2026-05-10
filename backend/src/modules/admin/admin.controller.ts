import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles }              from '../../common/decorators/roles.decorator';
import { RolesGuard }         from '../../common/guards/roles.guard';
import { AdminService }       from './admin.service';
import { CreatePaletteDto }   from './dto/create-palette.dto';
import { CreateBackgroundDto } from './dto/create-background.dto';
import { CreateBuildingDto }  from './dto/create-building.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Backgrounds ────────────────────────────────────────────────────────────

  @Post('backgrounds/upload')
  async uploadBackground(
    @Req() req: any,
    @Query('name')        name: string,
    @Query('description') description: string,
    @Query('rarity')      rarity: string,
    @Query('priceCoins')  priceCoins: string,
    @Query('stock')       stock: string,
  ) {
    const data = await req.file();
    if (!data) throw new BadRequestException('Nenhum arquivo enviado.');

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    if (!name)       throw new BadRequestException('Parâmetro obrigatório: name');
    if (!rarity)     throw new BadRequestException('Parâmetro obrigatório: rarity');
    if (!priceCoins || isNaN(Number(priceCoins))) {
      throw new BadRequestException('Parâmetro obrigatório e válido: priceCoins (número)');
    }

    const dto: CreateBackgroundDto = {
      name, description: description || undefined,
      rarity: rarity as any, priceCoins: Number(priceCoins),
      stock: stock && !isNaN(Number(stock)) ? Number(stock) : undefined,
    };

    return this.adminService.createBackground(
      { filename: data.filename, mimetype: data.mimetype, buffer }, dto,
    );
  }

  // ── Palettes ───────────────────────────────────────────────────────────────

  @Post('palettes')
  createPalette(@Body() dto: CreatePaletteDto) {
    return this.adminService.createPalette(dto);
  }

  // ── Frames ─────────────────────────────────────────────────────────────────

  @Post('frames')
  createFrame(
    @Body() dto: {
      name: string; description?: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      priceCoins: number; presetKey: string;
    },
  ) {
    return this.adminService.createFramePreset(dto);
  }

  // ── Materials ──────────────────────────────────────────────────────────────

  @Get('materials')
  listMaterials() {
    return this.adminService.listMaterials();
  }

  @Post('materials')
  async createMaterial(
    @Req() req: any,
    @Query('name')             name: string,
    @Query('roughness')        roughness: string,
    @Query('metalness')        metalness: string,
    @Query('albedoColorSpace') albedoColorSpace: string,
    @Query('flipY')            flipY: string,
  ) {
    if (!name) throw new BadRequestException('Parâmetro obrigatório: name');

    const files: Record<string, { filename: string; mimetype: string; buffer: Buffer }> = {};
    for await (const part of req.files()) {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) chunks.push(chunk);
      files[part.fieldname] = { filename: part.filename, mimetype: part.mimetype, buffer: Buffer.concat(chunks) };
    }

    return this.adminService.createMaterial(files, {
      name,
      roughness:        roughness        ? Number(roughness)                      : undefined,
      metalness:        metalness        ? Number(metalness)                      : undefined,
      albedoColorSpace: albedoColorSpace ?? 'srgb',
      flipY:            flipY === 'true' || flipY === '1',
    });
  }

  @Patch('materials/:id')
  async updateMaterial(
    @Param('id')               id: string,
    @Req()                     req: any,
    @Query('name')             name: string,
    @Query('roughness')        roughness: string,
    @Query('metalness')        metalness: string,
    @Query('albedoColorSpace') albedoColorSpace: string,
    @Query('flipY')            flipY: string,
  ) {
    const files: Record<string, { filename: string; mimetype: string; buffer: Buffer }> = {};
    for await (const part of req.files()) {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) chunks.push(chunk);
      files[part.fieldname] = { filename: part.filename, mimetype: part.mimetype, buffer: Buffer.concat(chunks) };
    }

    return this.adminService.updateMaterial(id, files, {
      name,
      roughness:        roughness        ? Number(roughness)   : undefined,
      metalness:        metalness        ? Number(metalness)   : undefined,
      albedoColorSpace: albedoColorSpace ?? undefined,
      flipY:            flipY !== undefined ? (flipY === 'true' || flipY === '1') : undefined,
    });
  }

  // ── Buildings ──────────────────────────────────────────────────────────────

  @Get('buildings')
  listBuildings() {
    return this.adminService.listBuildings();
  }

  @Post('buildings')
  async createBuilding(
    @Req() req: any,
    @Query('name')        name: string,
    @Query('category')    category: string,
    @Query('placement')   placement: string,
    @Query('ccuCost')     ccuCost: string,
    @Query('sizeX')       sizeX: string,
    @Query('sizeZ')       sizeZ: string,
    @Query('priceCoins')  priceCoins: string,
    @Query('icon')        icon: string,
    @Query('materialId')  materialId: string,
    @Query('scaleFactor') scaleFactor: string,
  ) {
    if (!name)     throw new BadRequestException('Parâmetro obrigatório: name');
    if (!category) throw new BadRequestException('Parâmetro obrigatório: category');
    if (!placement) throw new BadRequestException('Parâmetro obrigatório: placement');

    const files: Record<string, { filename: string; mimetype: string; buffer: Buffer }> = {};
    for await (const part of req.files()) {
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) chunks.push(chunk);
      files[part.fieldname] = { filename: part.filename, mimetype: part.mimetype, buffer: Buffer.concat(chunks) };
    }

    const dto: CreateBuildingDto = {
      name, category: category as any, placement: placement as any,
      ccuCost: Number(ccuCost) || 10, sizeX: Number(sizeX) || 1, sizeZ: Number(sizeZ) || 1,
      priceCoins: Number(priceCoins) || 0,
      icon: icon || undefined, materialId: materialId || undefined,
      scaleFactor: scaleFactor ? Number(scaleFactor) : undefined,
    };

    return this.adminService.createBuilding(files, dto);
  }

  // ── Marketplace list / toggle ───────────────────────────────────────────────

  @Get('items')
  listAll() { return this.adminService.listAll(); }

  @Patch('items/:id/toggle')
  toggle(@Param('id') id: string, @Body('active') active: boolean) {
    return this.adminService.toggleItem(id, active);
  }

  @Patch('buildings/:id/toggle')
  toggleBuilding(@Param('id') id: string, @Body('active') active: boolean) {
    return this.adminService.toggleBuilding(id, active);
  }
}
