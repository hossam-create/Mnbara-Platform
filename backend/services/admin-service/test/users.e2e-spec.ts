import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();

    // Generate a mock token for authenticated requests
    accessToken = jwtService.sign({ sub: 1, email: 'admin@test.com', roles: ['admin'] });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/users (GET) - should return 401 without token', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(401);
  });

  it('/users (GET) - should return users with valid token', () => {
    // Note: This assumes the DB has data or handles empty state gracefully
    // In a real e2e, we'd seed the DB first
    return request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });
});
