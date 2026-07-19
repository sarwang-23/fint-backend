import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../common/mail/mail.service';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: {
            findByEmail: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            findById: jest.fn(),
            findByRefreshToken: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock_access_token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const map: Record<string, any> = {
                BCRYPT_ROUNDS: 1,
                REFRESH_EXPIRES_IN: '7',
                FRONTEND_URL: 'http://localhost:3000',
              };
              return map[key];
            }),
          },
        },
        {
          provide: MailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    authRepository = module.get(AuthRepository);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  describe('signup()', () => {
    const signupDto = {
      name: 'Test User',
      email: 'test@fint.com',
      password: 'Password@123',
      phone: '9876543210',
      gender: 'MALE' as any,
    };

    it('should create a new user and send verification email', async () => {
      authRepository.findByEmail.mockResolvedValue(null);
      authRepository.createUser.mockResolvedValue({
        id: 'user-1',
        email: 'test@fint.com',
        fullName: 'Test User',
      } as any);
      authRepository.updateUser.mockResolvedValue({} as any);

      const result = await service.signup(signupDto);
      expect(result.message).toContain('Account created successfully');
      expect(authRepository.createUser).toHaveBeenCalledTimes(1);
      expect(mailService.sendMail).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      authRepository.findByEmail.mockResolvedValue({ id: 'existing' } as any);
      await expect(service.signup(signupDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login()', () => {
    it('should return access and refresh tokens on valid login', async () => {
      authRepository.findById.mockResolvedValue({
        id: 'user-1',
        email: 'test@fint.com',
        role: 'USER',
        fullName: 'Test User',
      } as any);
      authRepository.updateUser.mockResolvedValue({} as any);

      const result = await service.login('user-1');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@fint.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      authRepository.findById.mockResolvedValue(null);
      await expect(service.login('bad-id')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser()', () => {
    it('should return user for valid credentials', async () => {
      const hashed = await bcrypt.hash('Password@123', 1);
      authRepository.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'test@fint.com',
        password: hashed,
        isActive: true,
      } as any);

      const result = await service.validateUser('test@fint.com', 'Password@123');
      expect(result).not.toBeNull();
      expect(result!.email).toBe('test@fint.com');
    });

    it('should return null for wrong password', async () => {
      const hashed = await bcrypt.hash('RealPassword', 1);
      authRepository.findByEmail.mockResolvedValue({
        password: hashed,
        isActive: true,
      } as any);

      const result = await service.validateUser('test@fint.com', 'WrongPassword');
      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      authRepository.findByEmail.mockResolvedValue({ isActive: false } as any);
      const result = await service.validateUser('test@fint.com', 'Password@123');
      expect(result).toBeNull();
    });
  });

  describe('logout()', () => {
    it('should clear refresh token on logout', async () => {
      authRepository.updateUser.mockResolvedValue({} as any);
      const result = await service.logout('user-1');
      expect(result.message).toBe('Logged out successfully');
      expect(authRepository.updateUser).toHaveBeenCalledWith('user-1', {
        refreshToken: null,
        refreshTokenExpiry: null,
      });
    });
  });

  describe('resetPassword()', () => {
    it('should throw BadRequestException for invalid or expired token', async () => {
      authRepository.findByRefreshToken.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'NewPass@123')).rejects.toThrow(BadRequestException);
    });
  });
});
