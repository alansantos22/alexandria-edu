import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VoucherRepository }  from './voucher.repository';
import { Voucher }            from './entities/voucher.entity';

@Injectable()
export class VoucherService {
  private readonly logger = new Logger(VoucherService.name);

  constructor(private readonly voucherRepo: VoucherRepository) {}

  async createVoucher(
    label: string | undefined,
    maxUses: number,
    accessDays: number,
    expiresAt: Date | null,
    createdBy: string,
  ): Promise<Voucher> {
    return this.voucherRepo.createVoucher(label ?? null, maxUses, accessDays, expiresAt, createdBy);
  }

  listVouchers(): Promise<Voucher[]> {
    return this.voucherRepo.listVouchers();
  }

  async redeemVoucher(
    userId: string,
    code: string,
  ): Promise<{ accessUntil: Date; accessDays: number; message: string }> {
    const voucher = await this.voucherRepo.findByCode(code);
    if (!voucher) throw new NotFoundException('Voucher inválido.');

    if (voucher.currentUses >= voucher.maxUses) {
      throw new BadRequestException('Este voucher já atingiu o limite de usos.');
    }

    if (voucher.expiresAt && voucher.expiresAt < new Date()) {
      throw new BadRequestException('Este voucher expirou.');
    }

    const alreadyUsed = await this.voucherRepo.hasUserUsedVoucher(voucher.id, userId);
    if (alreadyUsed) throw new BadRequestException('Você já utilizou este voucher.');

    const accessUntil = await this.voucherRepo.redeemVoucher(voucher, userId);

    this.logger.log(`User ${userId} redeemed voucher ${voucher.code} → access until ${accessUntil}`);

    return {
      accessUntil,
      accessDays: voucher.accessDays,
      message:    `Acesso liberado por ${voucher.accessDays} dia(s) até ${accessUntil.toLocaleDateString('pt-BR')}.`,
    };
  }

  listUses(voucherId: string) {
    return this.voucherRepo.listUses(voucherId);
  }
}
