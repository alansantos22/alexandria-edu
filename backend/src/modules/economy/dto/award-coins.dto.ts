import { IsIn, IsOptional, IsString } from 'class-validator';
import { CoinEventType } from '../entities/coin-transaction.entity';

const VALID_EVENTS: CoinEventType[] = [
  'LESSON_COMPLETE',
  'QUIZ_PASS_70',
  'QUIZ_PASS_90',
  'DAILY_STREAK',
  'COURSE_PURCHASE_CASHBACK',
  'MARKETPLACE_PURCHASE',
];

export class AwardCoinsDto {
  @IsIn(VALID_EVENTS)
  eventType: CoinEventType;

  @IsOptional()
  @IsString()
  referenceId?: string;
}
