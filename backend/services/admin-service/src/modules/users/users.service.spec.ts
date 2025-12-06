import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { DatabaseService } from '../../database/database.service';
import { NotFoundException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let dbService: DatabaseService;

  const mockDbService = {
    query: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    insert: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: mockDbService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    dbService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const result = {
        rows: [
          { id: 1, email: 'test@test.com', first_name: 'Test', last_name: 'User' },
        ],
        rowCount: 1,
      };
      mockDbService.query.mockResolvedValue(result);

      const users = await service.findAll({ page: 1, limit: 10 });
      expect(users.data).toEqual(result.rows);
      expect(users.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = { id: 1, email: 'test@test.com' };
      mockDbService.findOne.mockResolvedValue(user);
      mockDbService.query.mockResolvedValue({ rows: [] }); // For roles

      const found = await service.findOne(1);
      expect(found).toEqual({ ...user, roles: [] });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockDbService.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
