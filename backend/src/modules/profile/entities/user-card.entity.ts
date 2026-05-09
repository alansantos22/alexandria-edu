import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'user_cards' })
@Unique('UK_USER_CARD', ['userId', 'cardId'])
export class UserCard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_USER_CARD_USER')
  @Column({ name: 'user_id', type: 'varchar', length: 36 })
  userId: string;

  @Index('IDX_USER_CARD_CARD')
  @Column({ name: 'card_id', type: 'varchar', length: 36 })
  cardId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @CreateDateColumn({ name: 'acquired_at', type: 'timestamp' })
  acquiredAt: Date;
}
