import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CurrentUser }        from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser }  from '../../shared/interfaces/jwt-payload.interface';
import { MarketplaceService } from './marketplace.service';
import { EquipItemDto }       from './dto/equip-item.dto';
import { RedeemTokenDto }     from './dto/vault.dto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /** Lista todos os itens ativos com info de posse e acessibilidade de preço */
  @Get('items')
  listItems(@CurrentUser() user: AuthenticatedUser) {
    return this.marketplaceService.listItems(user.id);
  }

  /** Compra de um item pelo id */
  @Post('items/:id/buy')
  purchaseItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') itemId: string,
  ) {
    return this.marketplaceService.purchaseItem(user.id, itemId);
  }

  /** Inventário completo do usuário com itens equipados */
  @Get('inventory')
  getInventory(@CurrentUser() user: AuthenticatedUser) {
    return this.marketplaceService.getUserInventory(user.id);
  }

  /** Equipa um item (altera active_*_item_id no perfil). itemId null = desequipar */
  @Put('equip')
  equipItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EquipItemDto,
  ) {
    return this.marketplaceService.equipItem(user.id, dto.itemId ?? null, dto.type);
  }

  /** Perfil público de um usuário (para exibir em posts do fórum, etc.) */
  @Get('profile/:userId')
  getPublicProfile(@Param('userId') userId: string) {
    return this.marketplaceService.getPublicProfile(userId);
  }

  /** Resgata um token de vault — adiciona item ao inventário sem custo */
  @Post('redeem')
  redeemToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RedeemTokenDto,
  ) {
    return this.marketplaceService.redeemToken(user.id, dto.code);
  }
}
