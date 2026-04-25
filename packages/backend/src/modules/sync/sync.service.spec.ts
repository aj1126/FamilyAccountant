import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';

const mockTx = {
  id: 'srv-uuid',
  localId: 'local-1',
  accountId: 'acc-1',
  householdId: 'hh-1',
  userId: 'user-1',
  amount: 100,
  currency: 'USD',
  description: 'Test',
  category: 'Food',
  transactionDate: '2024-01-01',
  syncStatus: 'synced',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

describe('SyncService', () => {
  let service: SyncService;
  const mockRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get(SyncService);
  });

  it('should create new transactions not yet on server', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockReturnValue(mockTx);
    mockRepo.save.mockResolvedValue(mockTx);
    mockRepo.find.mockResolvedValue([mockTx]);

    const result = await service.sync('hh-1', 'user-1', {
      transactions: [
        {
          ...mockTx,
          syncStatus: 'pending',
          createdAt: mockTx.createdAt.toISOString(),
          updatedAt: mockTx.updatedAt.toISOString(),
          deletedAt: null,
        },
      ],
      lastSyncedAt: null,
    });

    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.transactions).toHaveLength(1);
    expect(result.syncedAt).toBeDefined();
  });

  it('should skip older incoming transactions (last-write-wins)', async () => {
    const serverUpdated = new Date('2024-06-01');
    mockRepo.findOne.mockResolvedValue({ ...mockTx, updatedAt: serverUpdated });
    mockRepo.find.mockResolvedValue([]);
    mockRepo.save.mockResolvedValue(mockTx);

    await service.sync('hh-1', 'user-1', {
      transactions: [
        {
          ...mockTx,
          updatedAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          syncStatus: 'pending',
          deletedAt: null,
        },
      ],
      lastSyncedAt: null,
    });

    expect(mockRepo.save).not.toHaveBeenCalled();
  });
});
