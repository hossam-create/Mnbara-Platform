import { Test, TestingModule } from '@nestjs/testing';
import { GuaranteeRulesService } from './guarantee-rules.service';
import { DatabaseService } from '../../database/database.service';

const mockDatabaseService = {
  query: jest.fn(),
  findMany: jest.fn(),
  findOne: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

describe('GuaranteeRulesService', () => {
  let service: GuaranteeRulesService;
  let db: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuaranteeRulesService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<GuaranteeRulesService>(GuaranteeRulesService);
    db = module.get<DatabaseService>(DatabaseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of rules', async () => {
      const mockRules = [
        {
          id: 1,
          name: 'Test Rule',
          applies_to: 'CATEGORY',
          coverage: 100,
          max_amount: 1000,
          auto_actions: {},
          conditions: {},
          thresholds: {},
          escalation: {},
          priority: 1,
          enabled: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      mockDatabaseService.findMany.mockResolvedValue(mockRules);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
      expect(result[0].name).toBe('Test Rule');
      expect(db.findMany).toHaveBeenCalledWith('guarantee_rules', {}, { orderBy: 'priority ASC' });
    });
  });

  describe('create', () => {
    it('should create a new rule', async () => {
      const dto: any = {
        name: 'New Rule',
        appliesTo: 'ALL',
        coverage: 100,
        maxAmount: 500,
        priority: 1,
      };
      
      const savedRule = {
        ...dto,
        id: 1,
        applies_to: 'ALL',
        max_amount: 500,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockDatabaseService.insert.mockResolvedValue(savedRule);

      const result = await service.create(dto);

      expect(result.id).toBe('1');
      expect(result.name).toBe('New Rule');
      expect(db.insert).toHaveBeenCalled();
    });
  });
});
