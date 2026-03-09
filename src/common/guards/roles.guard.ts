import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_USER_KEY } from '../decorators/user.decorator';
import { Role } from '../enums/role.enum';

/**
 * Role-based access control guard.
 *
 * Access logic:
 * - @Public()       → everyone (no auth needed)
 * - @User()         → user + admin
 * - No decorator    → admin only
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const isUser = this.reflector.getAllAndOverride<boolean>(IS_USER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // @User() → user and admin can access
    if (isUser) {
      return user.role === Role.USER || user.role === Role.ADMIN;
    }

    // No decorator → admin only
    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access only');
    }

    return true;
  }
}
