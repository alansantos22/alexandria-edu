import { Controller, Get, Post, Query, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus } from '@nestjs/common';
import { EconomyService } from './economy.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface';

@Controller('economy')
export class EconomyController {
  constructor(private readonly economyService: EconomyService) {}

  /** GET /economy/balance — saldo atual do usuário autenticado */
  @Get('balance')
  async getBalance(@CurrentUser() user: AuthenticatedUser) {
    return this.economyService.getBalance(user.id);
  }

  /** GET /economy/history?page=1&limit=20 — histórico de transações */
  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeLimit = Math.min(limit, 50);
    return this.economyService.getHistory(user.id, page, safeLimit);
  }

  /** POST /economy/simulate-purchase — cashback simulado de compra */
  @Post('simulate-purchase')
  @HttpCode(HttpStatus.OK)
  async simulatePurchase(@CurrentUser() user: AuthenticatedUser) {
    const tx = await this.economyService.simulateCoursePurchaseCashback(user.id);
    const { balance } = await this.economyService.getBalance(user.id);
    return {
      message: 'Cashback creditado com sucesso',
      coinsEarned: tx?.delta ?? 0,
      balance,
    };
  }
}
