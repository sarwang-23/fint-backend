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
import { MailService } from '../common/mail/mail.service';
import { AuthRepository } from './auth.repository';
import { SignupDto } from './dto/signup.dto';
import { TokenPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ─── Signup ───────────────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    const existing = await this.authRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.password, Number(rounds));

    const user = await this.authRepository.createUser(
      {
        fullName: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
      },
      dto.gender,
    );

    // Send verification email
    await this.sendVerificationEmail(user.email, user.id);

    return {
      message: 'Account created successfully. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  private async sendVerificationEmail(email: string, userId: string) {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.authRepository.updateUser(userId, {
      refreshToken: hashedToken, // Reusing refreshToken field for verification token during signup
      refreshTokenExpiry: expiry,
    });

    const verifyUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;

    await this.mailService.sendMail(
      email,
      'Verify your Fint Account',
      `<p>Please click the link below to verify your email address:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
    );
  }

  // ─── Validate user (used by LocalStrategy) ────────────────────────────────
  async validateUser(email: string, password: string) {
    const user = await this.authRepository.findByEmail(email);
    if (!user || !user.isActive) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    // Optional: enforce email verification before login
    // if (!user.isVerified) {
    //   throw new UnauthorizedException('Please verify your email first');
    // }

    return user;
  }

  // ─── Login ────────────────────────────────────────────────────────────────
  async login(userId: string) {
    const user = await this.authRepository.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

    await this.authRepository.updateUser(user.id, { lastLogin: new Date() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ─── Refresh Token ────────────────────────────────────────────────────────
  async refresh(token: string) {
    const user = await this.authRepository.findByRefreshToken(token);

    if (!user || !user.refreshTokenExpiry) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > user.refreshTokenExpiry) {
      throw new UnauthorizedException('Refresh token expired. Please login again.');
    }

    const payload: TokenPayload = {
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
    await this.authRepository.updateUser(userId, {
      refreshToken: null,
      refreshTokenExpiry: null,
    });
    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ──────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.authRepository.findByEmail(email);

    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.authRepository.updateUser(user.id, {
      refreshToken: hashedToken,
      refreshTokenExpiry: expiry,
    });

    const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    await this.mailService.sendMail(
      email,
      'Reset Your Fint Password',
      `<p>Click the link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`
    );

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // ─── Reset Password ───────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.authRepository.findByRefreshToken(hashedToken);

    if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const rounds = this.configService.get<number>('BCRYPT_ROUNDS') ?? 12;
    const hashedPassword = await bcrypt.hash(newPassword, Number(rounds));

    await this.authRepository.updateUser(user.id, {
      password: hashedPassword,
      refreshToken: null,
      refreshTokenExpiry: null,
    });

    return { message: 'Password reset successfully' };
  }

  // ─── Verify Email ─────────────────────────────────────────────────────────
  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.authRepository.findByRefreshToken(hashedToken);

    if (!user || !user.refreshTokenExpiry || user.refreshTokenExpiry < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.authRepository.updateUser(user.id, {
      isVerified: true,
      emailVerifiedAt: new Date(),
      refreshToken: null,
      refreshTokenExpiry: null,
    });

    return { message: 'Email verified successfully' };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────
  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresInDays = this.configService.get<string>('REFRESH_EXPIRES_IN') ?? '7d';
    const days = parseInt(expiresInDays);
    const expiry = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.authRepository.updateUser(userId, {
      refreshToken: token,
      refreshTokenExpiry: expiry,
    });

    return token;
  }
}
