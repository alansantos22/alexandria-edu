import {
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
import { Roles }         from '../../common/decorators/roles.decorator';
import { RolesGuard }    from '../../common/guards/roles.guard';
import { Public }        from '../../common/decorators/public.decorator';
import { AdminService }  from './admin.service';
import { CreatePaletteDto }    from './dto/create-palette.dto';
import { CreateBackgroundDto } from './dto/create-background.dto';

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** Upload de imagem de background + criação de item no marketplace */
  @Post('backgrounds/upload')
  async uploadBackground(
    @Req() req: any,
    @Query('name')        name: string,
    @Query('description') description: string,
    @Query('rarity')      rarity: string,
    @Query('priceCoins')  priceCoins: string,
    @Query('stock')       stock: string,
  ) {
    // Fastify multipart: lemos o arquivo como buffer
    const data = await req.file();
    if (!data) throw new Error('Nenhum arquivo enviado.');

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const dto: CreateBackgroundDto = {
      name,
      description,
      rarity:     rarity as any,
      priceCoins: Number(priceCoins),
      stock:      stock ? Number(stock) : undefined,
    };

    return this.adminService.createBackground(
      { filename: data.filename, mimetype: data.mimetype, buffer },
      dto,
    );
  }

  /** Criar paleta de cores (wallpaper CSS) no marketplace */
  @Post('palettes')
  createPalette(@Body() dto: CreatePaletteDto) {
    return this.adminService.createPalette(dto);
  }

  /** Criar frame CSS no marketplace */
  @Post('frames')
  createFrame(
    @Body() dto: {
      name: string;
      description?: string;
      rarity: 'common' | 'rare' | 'epic' | 'legendary';
      priceCoins: number;
      presetKey: string;
    },
  ) {
    return this.adminService.createFramePreset(dto);
  }

  /** Listar todos os itens */
  @Get('items')
  listAll() {
    return this.adminService.listAll();
  }

  /** Ativar ou desativar item */
  @Patch('items/:id/toggle')
  toggle(@Param('id') id: string, @Body('active') active: boolean) {
    return this.adminService.toggleItem(id, active);
  }
}
