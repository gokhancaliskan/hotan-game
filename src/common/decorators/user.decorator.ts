import { SetMetadata } from '@nestjs/common';

export const IS_USER_KEY = 'isUser';

/**
 * @User() → accessible by user and admin roles.
 * JWT required, role must be 'user' or 'admin'.
 */
export const User = () => SetMetadata(IS_USER_KEY, true);
