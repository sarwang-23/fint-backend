import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { UpdateAccountDto, UpdateProfileDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async getMe(userId: string) {
    const user = await this.usersRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    // Never leak these, even though they're not asked for by name — this
    // response goes straight back to the frontend as-is.
    const { password, refreshToken, refreshTokenExpiry, ...safeUser } = user;
    return safeUser;
  }

  async updateAccount(userId: string, dto: UpdateAccountDto) {
    await this.getMe(userId); // 404s if the user somehow doesn't exist
    const updated = await this.usersRepository.updateAccount(userId, dto);
    const { password, refreshToken, refreshTokenExpiry, ...safeUser } = updated;
    return safeUser;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.getMe(userId);
    const { dateOfBirth, ...rest } = dto;
    return this.usersRepository.upsertProfile(userId, {
      ...rest,
      ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    });
  }
}
