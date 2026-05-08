import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@/core/auth/auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: any, _res: any, next: (err?: any) => void) {
    const header: string =
      req.headers?.authorization || req.headers?.Authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const payload = await this.authService.validateToken(token);
    if (!payload) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
    };
    next();
  }
}
