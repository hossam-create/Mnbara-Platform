import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { MfaService } from './mfa/mfa.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let dbService: DatabaseService;
  let jwtService: JwtService;
  let mfaService: MfaService;

  const mockDbService = {
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    query: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMfaService = {
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDbService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MfaService, useValue: mockMfaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dbService = module.get<DatabaseService>(DatabaseService);
    jwtService = module.get<JwtService>(JwtService);
    mfaService = module.get<MfaService>(MfaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const ip = '127.0.0.1';
    const ua = 'TestAgent';

    it('should throw UnauthorizedException if user not found', async () => {
      mockDbService.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto, ip, ua)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('wrongpassword', 10),
        account_locked: false,
      };
      mockDbService.findOne.mockResolvedValue(user);

      await expect(service.login(loginDto, ip, ua)).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens on successful login', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        account_locked: false,
        first_name: 'Test',
        last_name: 'User',
      };
      mockDbService.findOne.mockResolvedValue(user);
      mockDbService.query.mockResolvedValue({ rows: [] }); // For roles/permissions
      mockJwtService.sign.mockReturnValue('mock_token');

      const result = await service.login(loginDto, ip, ua);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(user.email);
    });

    it('should require MFA if enabled', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        account_locked: false,
      };
      mockDbService.findOne.mockImplementation((table) => {
        if (table === 'users') return Promise.resolve(user);
        if (table === 'user_mfa') return Promise.resolve({ enabled: true });
        return Promise.resolve(null);
      });

      const result = await service.login(loginDto, ip, ua);
      expect(result).toEqual({ requiresMfa: true });
    });
  });
});
