import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';
import { AccountEntity } from '../../entities/account.entity';

const mockTx = {
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  localId: 'b1b2c3d4-0000-0000-0000-000000000002',
  accountId: 'c1b2c3d4-0000-0000-0000-000000000003',
  householdId: 'd1b2c3d4-0000-0000-0000-000000000004',
  userId: 'e1b2c3d4-0000-0000-0000-000000000005',
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
  const mockAccountRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: getRepositoryToken(TransactionEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(AccountEntity),
          useValue: mockAccountRepo,
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

    const result = await service.sync('d1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000005', {
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

    await service.sync('d1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000005', {
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

  it('should update existing transaction when incoming is newer (last-write-wins)', async () => {
    const serverUpdated = new Date('2024-01-01');
    const existingTx = { ...mockTx, updatedAt: serverUpdated };
    mockRepo.findOne.mockResolvedValue(existingTx);
    mockRepo.find.mockResolvedValue([existingTx]);
    mockRepo.save.mockResolvedValue({ ...existingTx, amount: 200 });

    await service.sync('d1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000005', {
      transactions: [
        {
          ...mockTx,
          amount: 200,
          updatedAt: '2024-06-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          syncStatus: 'pending',
          deletedAt: null,
        },
      ],
      lastSyncedAt: null,
    });

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 200 }),
    );
  });

  it('should use lastSyncedAt when querying server delta', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    mockRepo.create.mockReturnValue(mockTx);
    mockRepo.save.mockResolvedValue(mockTx);
    mockRepo.find.mockResolvedValue([]);

    const result = await service.sync('d1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000005', {
      transactions: [],
      lastSyncedAt: '2024-03-01T00:00:00Z',
    });

    expect(mockRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ householdId: 'd1b2c3d4-0000-0000-0000-000000000004' }),
      }),
    );

    const findCallArg = mockRepo.find.mock.calls[0][0];
    expect(findCallArg.where.updatedAt).toEqual(
      expect.objectContaining({
        _type: 'moreThan',
        _value: new Date('2024-03-01T00:00:00Z'),
      }),
    );
    expect(result.syncedAt).toBeDefined();
  });

  it('should create a new transaction with a non-null deletedAt when incoming has deletedAt set', async () => {
    mockRepo.findOne.mockResolvedValue(null);
    const deletedTx = { ...mockTx, deletedAt: new Date('2024-04-01') };
    mockRepo.create.mockReturnValue(deletedTx);
    mockRepo.save.mockResolvedValue(deletedTx);
    mockRepo.find.mockResolvedValue([]);

    await service.sync('d1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000005', {
      transactions: [
        {
          ...mockTx,
          syncStatus: 'pending',
          createdAt: mockTx.createdAt.toISOString(),
          updatedAt: mockTx.updatedAt.toISOString(),
          deletedAt: '2024-04-01T00:00:00Z',
        },
      ],
      lastSyncedAt: null,
    });

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: new Date('2024-04-01T00:00:00Z') }),
    );
  });

  it('should update existing transaction with a non-null deletedAt when incoming has deletedAt set', async () => {
    const serverUpdated = new Date('2024-01-01');
    const existingTx = { ...mockTx, updatedAt: serverUpdated };
    mockRepo.findOne.mockResolvedValue(existingTx);
    mockRepo.find.mockResolvedValue([existingTx]);
    mockRepo.save.mockResolvedValue({ ...existingTx, deletedAt: new Date('2024-04-01') });

    await service.sync('d1b2c3d4-0000-0000-0000-000000000004', 'e1b2c3d4-0000-0000-0000-000000000005', {
      transactions: [
        {
          ...mockTx,
          updatedAt: '2024-06-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z',
          syncStatus: 'pending',
          deletedAt: '2024-04-01T00:00:00Z',
        },
      ],
      lastSyncedAt: null,
    });

    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ deletedAt: new Date('2024-04-01T00:00:00Z') }),
    );
  });
});
