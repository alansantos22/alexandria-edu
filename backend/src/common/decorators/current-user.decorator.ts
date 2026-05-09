import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@/shared/interfaces/jwt-payload.interface';

export const CurrentUser = createParamDecorator(
  (field: string | undefined, ctx: ExecutionContext) => {
    const user: AuthenticatedUser = ctx.switchToHttp().getRequest().user;
    return field ? user?.[field as keyof AuthenticatedUser] : user;
  },
);
