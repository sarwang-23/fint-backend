import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { SignupDto } from '../dto/signup.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── Signup ───────────────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    // 1. Check email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // 2. Hash password
    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.password, Number(rounds));

    // 3. Create user + profile in a transaction
    const user = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: newUser.id,
          gender: dto.gender ?? null,
        },
      });

      return newUser;
    });

    return {
      message: 'Account created successfully',
      userId: user.id,
    };
  }

  // ─── Validate user (used by LocalStrategy) ────────────────────────────────
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update lastLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refresh(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { refreshToken: token },
    });

    if (!user || !user.refreshTokenExpiry) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > user.refreshTokenExpiry) {
      throw new UnauthorizedException('Refresh token expired. Please login again.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null,
      },
    });
    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashedToken,       // reusing field for reset token
        refreshTokenExpiry: expiry,
      },
    });

    // Actually sends the email now (via Mailhog in dev, real SMTP in prod)
    // instead of just logging the token to the console.
    await this.notificationsService.notify(
      user.id,
      'Reset your FINT password',
      `We received a request to reset your password. Use this token within 15 minutes: ${resetToken}\n\nIf you didn't request this, you can safely ignore this email.`,
    );

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: hashedToken,
        refreshTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    const hashedPassword = await bcrypt.hash(newPassword, Number(rounds));

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        refreshToken: null,
        refreshTokenExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        refreshToken: hashedToken,
        refreshTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerifiedAt: new Date(),
        refreshToken: null,
        refreshTokenExpiry: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresInDays = this.configService.get<string>('REFRESH_EXPIRES_IN') ?? '7d';
    const days = parseInt(expiresInDays);
    const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: token,
        refreshTokenExpiry: expiry,
      },
    });

    return token;
  }
}
