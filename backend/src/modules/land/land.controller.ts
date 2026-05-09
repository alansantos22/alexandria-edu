import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { LandService } from './land.service'
import { PurchaseTileDto } from './dto/purchase-tile.dto'
import { CurrentUser } from '@/common/decorators/current-user.decorator'
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface'
import { Public } from '@/common/decorators/public.decorator'

@Controller('land')
export class LandController {
  constructor(private readonly landService: LandService) {}

  /** GET /land/:cityUserId — visualizar tiles de qualquer cidade (público) */
  @Public()
  @Get(':cityUserId')
  getLand(@Param('cityUserId') cityUserId: string) {
    return this.landService.getLand(cityUserId)
  }

  /** POST /land/purchase — comprar tile da própria cidade (autenticado) */
  @Post('purchase')
  purchaseTile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PurchaseTileDto,
  ) {
    return this.landService.purchaseTile(user.id, dto.tileX, dto.tileZ)
  }
}
