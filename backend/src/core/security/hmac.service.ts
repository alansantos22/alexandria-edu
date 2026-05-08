import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class HmacService {
  private readonly secret = process.env.HMAC_SECRET || 'change-me';

  /**
   * Gera HMAC-SHA256 do payload.
   */
  sign(payload: Record<string, any>): string {
    return crypto
      .createHmac('sha256', this.secret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Valida HMAC com comparação em tempo constante.
   */
  verify(payload: Record<string, any>, hmac: string): boolean {
    const expected = this.sign(payload);
    if (expected.length !== hmac.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hmac));
  }
}
