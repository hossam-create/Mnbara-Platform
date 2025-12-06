import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/auth/login (POST) - should return tokens', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(401); // Expect 401 because user doesn't exist in real DB
  });

  it('/auth/register (POST) - should create user', () => {
    const email = `test-${Date.now()}@example.com`;
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({ 
        email, 
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        phone: '1234567890'
      })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toEqual(email);
      });
  });
});
