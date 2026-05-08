import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '@/core/auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global de autenticação JWT.
 * Substitui o AuthMiddleware que não funciona corretamente com Fastify.
 * Rotas marcadas com @Public() são ignoradas.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const header: string =
      request.headers?.authorization || request.headers?.Authorization || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const payload = await this.authService.validateToken(token);
    if (!payload) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      isActive: payload.isActive,
    };

    return true;
  }
}
