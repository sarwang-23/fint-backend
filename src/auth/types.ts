import { UserRole } from '@prisma/client';

export type RoleType = UserRole;

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
