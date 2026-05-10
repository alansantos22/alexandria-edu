import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard }    from '../../common/guards/roles.guard';
import { Roles }         from '../../common/decorators/roles.decorator';
import { CurrentUser }   from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../shared/interfaces/jwt-payload.interface';
import { EconomyService } from './economy.service';
import { AdminAdjustCoinsDto, ReviewFlagDto } from './dto/admin-economy.dto';

@Controller('admin/economy')
@UseGuards(RolesGuard)
@Roles('admin')
export class AdminEconomyController {
  constructor(private readonly economyService: EconomyService) {}

  /** GET /admin/economy/users?page=1&limit=20 — todos os usuários com saldo */
  @Get('users')
  getUsers(
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.economyService.getUsersWithBalance(page, Math.min(limit, 50));
  }

  /** GET /admin/economy/users/:id/history — histórico de transações de um aluno */
  @Get('users/:id/history')
  getUserHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page',  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.economyService.getHistory(id, page, Math.min(limit, 50));
  }

  /** POST /admin/economy/adjust — crédito/débito manual com nota */
  @Post('adjust')
  @HttpCode(HttpStatus.OK)
  async adjust(
    @Body() dto: AdminAdjustCoinsDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    const delta = dto.direction === 'credit' ? dto.amount : -dto.amount;
    const tx = await this.economyService.adminAdjust(
      dto.userId,
      delta,
      `[Admin: ${admin.email}] ${dto.note}`,
    );
    return { transaction: tx };
  }

  /** GET /admin/economy/flags?onlyPending=true — usuários sinalizados por fraude */
  @Get('flags')
  getFlags(
    @Query('page',        new DefaultValuePipe(1),    ParseIntPipe)  page: number,
    @Query('limit',       new DefaultValuePipe(20),   ParseIntPipe)  limit: number,
    @Query('onlyPending', new DefaultValuePipe(true), ParseBoolPipe) onlyPending: boolean,
  ) {
    return this.economyService.getFlaggedUsers(page, Math.min(limit, 50), onlyPending);
  }

  /** PATCH /admin/economy/flags/:id/review — marcar flag como revisada */
  @Patch('flags/:id/review')
  @HttpCode(HttpStatus.OK)
  reviewFlag(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthenticatedUser,
    @Body() _dto: ReviewFlagDto,
  ) {
    return this.economyService.reviewFlag(id, admin.id);
  }
}
