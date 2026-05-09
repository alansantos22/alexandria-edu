import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type UserRole = 'admin' | 'student';

/** Garante que mysql2 v3 (que retorna TINYINT como 0/1/Buffer) seja sempre boolean */
const boolTransformer = {
  to: (val: boolean) => val,
  from: (val: unknown): boolean => val === true || val === 1 || val === '1',
};

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('UK_USERS_USERNAME', { unique: true })
  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Index('UK_USERS_EMAIL', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: ['admin', 'student'], default: 'student' })
  role: UserRole;

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 0, transformer: boolTransformer })
  isActive: boolean;

  @Column({ name: 'is_verified', type: 'tinyint', width: 1, default: 0, transformer: boolTransformer })
  isVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'xp', type: 'int', default: 0 })
  xp: number;

  @Column({ name: 'level', type: 'int', default: 1 })
  level: number;

  @Column({ name: 'streak_days', type: 'int', default: 0 })
  streakDays: number;

  @Column({ name: 'last_activity_at', type: 'timestamp', nullable: true })
  lastActivityAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
