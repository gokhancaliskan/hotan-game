import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * @Public() → accessible by everyone (public + user + admin)
 * No JWT required.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
