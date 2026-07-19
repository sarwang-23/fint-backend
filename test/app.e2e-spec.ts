import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── Signup ───────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/signup', () => {
    it('should reject an invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: 'not-an-email',
          password: 'Password@123',
        })
        .expect(400);
    });

    it('should reject a weak password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/signup')
        .send({
          name: 'Test User',
          email: 'e2e-test@fint.com',
          password: '1234',
        })
        .expect(400);
    });
  });

  // ─── Login ────────────────────────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@fint.com',
          password: 'Password@123',
        })
        .expect(401);
    });
  });

  // ─── Protected Routes ─────────────────────────────────────────────────────
  describe('GET /api/v1/finance/income', () => {
    it('should return 401 without a token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/finance/income')
        .expect(401);
    });
  });

  describe('GET /api/v1/score/current', () => {
    it('should return 401 without a token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/score/current')
        .expect(401);
    });
  });

  describe('GET /api/v1/analytics/dashboard', () => {
    it('should return 401 without a token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/dashboard')
        .expect(401);
    });
  });
});
