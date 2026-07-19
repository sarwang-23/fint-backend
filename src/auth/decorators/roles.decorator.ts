import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Usage: @Roles(UserRole.ADMIN) alongside @UseGuards(JwtAuthGuard, RolesGuard).
// Must come after JwtAuthGuard in the guard list — RolesGuard reads
// request.user, which JwtAuthGuard is what puts there in the first place.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
