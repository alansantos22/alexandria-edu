import { Injectable }          from '@nestjs/common';
import { InjectRepository }    from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Voucher }             from './entities/voucher.entity';
import { VoucherUse }          from './entities/voucher-use.entity';

@Injectable()
export class VoucherRepository {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,

    @InjectRepository(VoucherUse)
    private readonly useRepo: Repository<VoucherUse>,

    private readonly dataSource: DataSource,
  ) {}

  // ── Geração ────────────────────────────────────────────────────────────

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) code += '-';
      else code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code; // ex: ABCD-EFGH-1234
  }

  async createVoucher(
    label: string | null,
    maxUses: number,
    accessDays: number,
    expiresAt: Date | null,
    createdBy: string,
  ): Promise<Voucher> {
    let code: string;
    let tries = 0;
    do {
      code = this.generateCode();
      tries++;
    } while (tries < 10 && await this.voucherRepo.count({ where: { code } }) > 0);

    const voucher = this.voucherRepo.create({ code, label, maxUses, accessDays, expiresAt, createdBy });
    return this.voucherRepo.save(voucher);
  }

  // ── Listagem ───────────────────────────────────────────────────────────

  listVouchers(): Promise<Voucher[]> {
    return this.voucherRepo.find({ order: { createdAt: 'DESC' } });
  }

  findByCode(code: string): Promise<Voucher | null> {
    return this.voucherRepo.findOne({ where: { code: code.toUpperCase().trim() } });
  }

  // ── Resgate ────────────────────────────────────────────────────────────

  async hasUserUsedVoucher(voucherId: string, userId: string): Promise<boolean> {
    const count = await this.useRepo.count({ where: { voucherId, userId } });
    return count > 0;
  }

  /** Incrementa usos e registra no audit trail + atualiza voucher_access_until no user */
  async redeemVoucher(voucher: Voucher, userId: string): Promise<Date> {
    const accessUntil = new Date();
    accessUntil.setDate(accessUntil.getDate() + voucher.accessDays);

    await this.dataSource.transaction(async (em) => {
      // Incrementar uso
      await em.increment(Voucher, { id: voucher.id }, 'currentUses', 1);

      // Registrar uso
      const use = em.create(VoucherUse, { voucherId: voucher.id, userId });
      await em.save(VoucherUse, use);

      // Atualizar acesso no user — usar query raw para evitar dependência da entidade User aqui
      await em.query(
        `UPDATE users SET voucher_access_until = ? WHERE id = ?`,
        [accessUntil, userId],
      );
    });

    return accessUntil;
  }

  // ── Uses ───────────────────────────────────────────────────────────────

  listUses(voucherId: string): Promise<VoucherUse[]> {
    return this.useRepo.find({ where: { voucherId }, order: { usedAt: 'DESC' } });
  }
}
