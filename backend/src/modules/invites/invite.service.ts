import {
  BadRequestException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Voucher, VoucherScope, VoucherDiscountKind, VoucherKind } from '../vouchers/entities/voucher.entity';
import { VoucherUse } from '../vouchers/entities/voucher-use.entity';
import { EnrollmentService } from '../enrollments/enrollment.service';
import { LiveClass } from '../live-classes/entities/live-class.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';

export interface CreateInviteInput {
  label?: string;
  kind: VoucherKind;            // 'access' | 'discount'
  scope: VoucherScope;          // 'global' | 'product' | 'cohort' | 'live_class'
  scopeId?: string | null;
  maxUses: number;
  expiresAt?: Date | null;
  accessDays?: number;          // só para kind=access (legacy global) — para escopo produto, herda do product
  // Para kind=discount:
  discountKind?: VoucherDiscountKind | null;
  discountPercent?: number;
  discountAmount?: number;
}

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(Voucher) private readonly voucherRepo: Repository<Voucher>,
    @InjectRepository(VoucherUse) private readonly useRepo: Repository<VoucherUse>,
    @InjectRepository(LiveClass) private readonly liveRepo: Repository<LiveClass>,
    @InjectRepository(Cohort) private readonly cohortRepo: Repository<Cohort>,
    private readonly enrollments: EnrollmentService,
  ) {}

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i === 4 || i === 8) code += '-';
      else code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async create(input: CreateInviteInput, createdBy: string): Promise<Voucher> {
    if (input.scope !== 'global' && !input.scopeId) {
      throw new BadRequestException('scopeId obrigatório para escopo diferente de global');
    }
    if (input.kind === 'discount' && !input.discountKind) {
      throw new BadRequestException('discountKind obrigatório para kind=discount');
    }

    let code: string;
    let tries = 0;
    do {
      code = this.generateCode();
      tries++;
    } while (tries < 10 && await this.voucherRepo.count({ where: { code } }) > 0);

    const v = this.voucherRepo.create({
      code,
      label: input.label ?? null,
      kind: input.kind,
      scope: input.scope,
      scopeId: input.scopeId ?? null,
      maxUses: input.maxUses,
      currentUses: 0,
      accessDays: input.accessDays ?? 30,
      expiresAt: input.expiresAt ?? null,
      discountKind: input.discountKind ?? null,
      discountPercent: String(input.discountPercent ?? 0),
      discountAmount: String(input.discountAmount ?? 0),
      createdBy,
    });
    return this.voucherRepo.save(v);
  }

  async preview(code: string): Promise<{
    code: string; kind: VoucherKind; scope: VoucherScope; scopeId: string | null;
    label: string | null; remainingUses: number; expired: boolean;
    discountKind: VoucherDiscountKind | null; discountPercent: number; discountAmount: number;
    targetMeta: any;
  }> {
    const v = await this.voucherRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!v) throw new NotFoundException('Convite inválido.');

    const expired = !!(v.expiresAt && v.expiresAt < new Date());
    const remaining = Math.max(0, v.maxUses - v.currentUses);

    let targetMeta: any = null;
    if (v.scope === 'live_class' && v.scopeId) {
      targetMeta = await this.liveRepo.findOne({ where: { id: v.scopeId } });
    } else if (v.scope === 'cohort' && v.scopeId) {
      targetMeta = await this.cohortRepo.findOne({ where: { id: v.scopeId } });
    }

    return {
      code: v.code,
      kind: v.kind,
      scope: v.scope,
      scopeId: v.scopeId,
      label: v.label,
      remainingUses: remaining,
      expired,
      discountKind: v.discountKind,
      discountPercent: parseFloat(v.discountPercent),
      discountAmount: parseFloat(v.discountAmount),
      targetMeta,
    };
  }

  /** Resgata convite de ACESSO (kind=access) — cria Enrollment correspondente */
  async redeemAccess(userId: string, code: string) {
    const v = await this.voucherRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!v) throw new NotFoundException('Convite inválido.');
    if (v.kind !== 'access') {
      throw new BadRequestException('Este código é um cupom de desconto. Use no checkout.');
    }
    if (v.currentUses >= v.maxUses) {
      throw new BadRequestException('Convite esgotado.');
    }
    if (v.expiresAt && v.expiresAt < new Date()) {
      throw new BadRequestException('Convite expirado.');
    }
    const alreadyUsed = await this.useRepo.count({ where: { voucherId: v.id, userId } });
    if (alreadyUsed > 0) throw new BadRequestException('Você já usou este convite.');

    // Determinar productId + cohortId conforme escopo
    let productId: string | null = null;
    let cohortId: string | null = null;
    if (v.scope === 'product' && v.scopeId) {
      productId = v.scopeId;
    } else if (v.scope === 'cohort' && v.scopeId) {
      const c = await this.cohortRepo.findOne({ where: { id: v.scopeId } });
      if (!c) throw new NotFoundException('Turma não encontrada');
      productId = c.productId;
      cohortId = c.id;
    } else if (v.scope === 'live_class' && v.scopeId) {
      const lc = await this.liveRepo.findOne({ where: { id: v.scopeId } });
      if (!lc) throw new NotFoundException('Aula não encontrada');
      const cohort = await this.cohortRepo.findOne({ where: { id: lc.cohortId } });
      if (!cohort) throw new NotFoundException('Turma da aula não encontrada');
      productId = cohort.productId;
      cohortId = cohort.id;
    } else {
      throw new BadRequestException('Este convite global não pode ser resgatado por aqui.');
    }

    // Cria enrollment com acesso conforme product config
    const enrollment = await this.enrollments.grant({
      userId,
      productId: productId!,
      cohortId,
      source: 'invite',
      sourceRef: v.code,
      // Se for invite só para uma live_class, dá quota de 1 e janela curta
      lessonsQuota: v.scope === 'live_class' ? 1 : undefined,
    });

    // Incrementa uso
    await this.voucherRepo.increment({ id: v.id }, 'currentUses', 1);
    await this.useRepo.save(this.useRepo.create({ voucherId: v.id, userId }));

    return {
      enrollmentId: enrollment.id,
      productId,
      cohortId,
      scope: v.scope,
      message: 'Acesso liberado com sucesso!',
    };
  }

  async listAll() {
    return this.voucherRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string) {
    return this.voucherRepo.findOne({ where: { id } });
  }

  async listUses(id: string) {
    return this.useRepo.find({ where: { voucherId: id }, order: { usedAt: 'DESC' } });
  }
}
