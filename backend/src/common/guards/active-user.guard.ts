import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * Garante que o usuário autenticado tem `is_active = true`.
 * Admins passam mesmo se inativos.
 */
@Injectable()
export class ActiveUserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    if (user.role === 'admin') return true;
    // Cobre boolean true, number 1, string '1' vindos do JWT ou DB
    const active = user.isActive === true || user.isActive === 1 || (user as any).isActive === '1';
    if (!active) {
      throw new ForbiddenException('Conta inativa. Realize o pagamento para continuar.');
    }

    return true;
  }
}
