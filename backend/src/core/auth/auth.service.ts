import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Argon2Service } from '@/core/security/argon2.service';
import { HmacService } from '@/core/security/hmac.service';
import { UsersService } from '@/modules/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from '@/shared/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly argon2Service: Argon2Service,
    private readonly hmacService: HmacService,
    private readonly usersService: UsersService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.createUser({
      email: dto.email,
      username: dto.username,
      password: dto.password,
    });

    return {
      success: true,
      message: 'Usuário registrado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive: Boolean(user.isActive),
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await this.argon2Service.verifyPassword(
      user.passwordHash,
      dto.password,
    );
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    await this.usersService.updateLastLogin(user.id);

    const isActive = Boolean(user.isActive);
    const token = this.generateToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      isActive,
    });

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        isActive,
      },
    };
  }

  generateToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'hmac'>): string {
    const base = { ...payload, iat: Math.floor(Date.now() / 1000) };
    const hmac = this.hmacService.sign(base);
    return this.jwtService.sign({ ...base, hmac });
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = this.jwtService.verify<JwtPayload>(token);
      const { hmac, exp, ...rest } = decoded;
      // Reconstrói payload original (sem hmac/exp) para validar HMAC
      const baseForHmac = {
        sub: rest.sub,
        email: rest.email,
        role: rest.role,
        isActive: rest.isActive,
        iat: rest.iat,
      };
      if (!hmac || !this.hmacService.verify(baseForHmac, hmac)) {
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }
}
