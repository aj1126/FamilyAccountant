import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { UserEntity } from '../../entities/user.entity';

const HOUSEHOLD_ID = 'aaaa0000-0000-0000-0000-000000000001';
const USER_ID = 'bbbb0000-0000-0000-0000-000000000002';
const TX_ID = 'cccc0000-0000-0000-0000-000000000003';
const LOCAL_ID = 'dddd0000-0000-0000-0000-000000000004';

const mockUser: Partial<UserEntity> = { id: USER_ID, householdId: HOUSEHOLD_ID };

const mockTx = {
  id: TX_ID,
  localId: LOCAL_ID,
  accountId: null,
  householdId: HOUSEHOLD_ID,
  userId: USER_ID,
  amount: 50,
  currency: 'USD',
  description: 'Groceries',
  category: 'Food',
  transactionDate: '2024-03-01',
  syncStatus: 'synced',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  user: null as never,
};

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: jest.Mocked<TransactionsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        {
          provide: TransactionsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(TransactionsController);
    service = module.get(TransactionsService);
  });

  describe('create', () => {
    it('should call service.create with userId, householdId, and dto', async () => {
      service.create.mockResolvedValue(mockTx);
      const dto = { localId: LOCAL_ID, amount: 50, description: 'Groceries', transactionDate: '2024-03-01' };
      const result = await controller.create(mockUser as UserEntity, dto);
      expect(service.create).toHaveBeenCalledWith(USER_ID, HOUSEHOLD_ID, dto);
      expect(result).toEqual(mockTx);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with householdId', async () => {
      service.findAll.mockResolvedValue([mockTx]);
      const result = await controller.findAll(mockUser as UserEntity);
      expect(service.findAll).toHaveBeenCalledWith(HOUSEHOLD_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and householdId', async () => {
      service.findOne.mockResolvedValue(mockTx);
      const result = await controller.findOne(TX_ID, mockUser as UserEntity);
      expect(service.findOne).toHaveBeenCalledWith(TX_ID, HOUSEHOLD_ID);
      expect(result).toEqual(mockTx);
    });
  });

  describe('update', () => {
    it('should call service.update with id, householdId, and dto', async () => {
      const updated = { ...mockTx, description: 'Lunch' };
      service.update.mockResolvedValue(updated);
      const result = await controller.update(TX_ID, mockUser as UserEntity, { description: 'Lunch' });
      expect(service.update).toHaveBeenCalledWith(TX_ID, HOUSEHOLD_ID, { description: 'Lunch' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call service.softDelete with id and householdId', async () => {
      service.softDelete.mockResolvedValue(undefined);
      await controller.remove(TX_ID, mockUser as UserEntity);
      expect(service.softDelete).toHaveBeenCalledWith(TX_ID, HOUSEHOLD_ID);
    });
  });
});
