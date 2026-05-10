import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard }          from '../../common/guards/roles.guard';
import { Roles }               from '../../common/decorators/roles.decorator';
import { CurrentUser }         from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser }   from '../../shared/interfaces/jwt-payload.interface';
import { MarketplaceService }  from './marketplace.service';
import { GenerateTokenDto }    from './dto/vault.dto';

@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin/vault')
export class AdminVaultController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  /** Lista todos os itens (ativos, inativos e vault) para gestão admin */
  @Get('items')
  listAllItems() {
    return this.marketplaceService.listAllItems();
  }

  /** Alterna o status vault de um item */
  @Patch('items/:id/toggle-vault')
  toggleVault(@Param('id') id: string) {
    return this.marketplaceService.toggleVault(id);
  }

  /** Gera um novo token de resgate para um item vault */
  @Post('tokens')
  generateToken(
    @Body() dto: GenerateTokenDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    return this.marketplaceService.generateToken(
      dto.itemId,
      dto.maxUses ?? 1,
      expiresAt,
      admin.id,
    );
  }

  /** Lista todos os tokens (opcionalmente filtra por item) */
  @Get('tokens')
  listTokens(@Query('itemId') itemId?: string) {
    return this.marketplaceService.listTokens(itemId);
  }
}
