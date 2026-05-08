import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Argon2Service } from '@/core/security/argon2.service';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly argon2Service: Argon2Service,
  ) {}

  async createUser(data: {
    email: string;
    username: string;
    password: string;
  }): Promise<User> {
    const existingByEmail = await this.usersRepository.findByEmail(data.email);
    if (existingByEmail) {
      throw new ConflictException('Email já cadastrado');
    }

    const existingByUsername = await this.usersRepository.findByUsername(
      data.username,
    );
    if (existingByUsername) {
      throw new ConflictException('Username já em uso');
    }

    const passwordHash = await this.argon2Service.hashPassword(data.password);

    return this.usersRepository.create({
      email: data.email,
      username: data.username,
      passwordHash,
      role: 'student',
      isActive: false,
      isVerified: false,
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }
}
