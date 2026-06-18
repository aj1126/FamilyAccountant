import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionEntity } from '../../entities/transaction.entity';
import { AccountEntity } from '../../entities/account.entity';

const HOUSEHOLD_A = 'aaaa0000-0000-0000-0000-000000000001';
const HOUSEHOLD_B = 'bbbb0000-0000-0000-0000-000000000002';
const TX_ID = 'cccc0000-0000-0000-0000-000000000003';
const USER_ID = 'dddd0000-0000-0000-0000-000000000004';
const LOCAL_ID = 'eeee0000-0000-0000-0000-000000000005';

const mockTx: Partial<TransactionEntity> = {
  id: TX_ID,
  localId: LOCAL_ID,
  accountId: null,
  householdId: HOUSEHOLD_A,
  userId: USER_ID,
  amount: 50,
  currency: 'USD',
  description: 'Groceries',
  category: 'Food',
  transactionDate: '2024-03-01',
  syncStatus: 'synced',
  createdAt: new Date('2024-03-01'),
  updatedAt: new Date('2024-03-01'),
  deletedAt: null,
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };
  const mockAccountRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getRepositoryToken(TransactionEntity), useValue: mockRepo },
        { provide: getRepositoryToken(AccountEntity), useValue: mockAccountRepo },
      ],
    }).compile();
    service = module.get(TransactionsService);
  });

  describe('create', () => {
    it('should create a transaction with syncStatus "synced"', async () => {
      mockRepo.create.mockReturnValue(mockTx);
      mockRepo.save.mockResolvedValue(mockTx);
      const dto = {
        localId: LOCAL_ID,
        amount: 50,
        description: 'Groceries',
        transactionDate: '2024-03-01',
      };
      const result = await service.create(USER_ID, HOUSEHOLD_A, dto);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: USER_ID, householdId: HOUSEHOLD_A, syncStatus: 'synced' }),
      );
      expect(result).toEqual(mockTx);
    });
  });

  describe('findAll', () => {
    it('should return all transactions for the household', async () => {
      mockRepo.findBy.mockResolvedValue([mockTx]);
      const result = await service.findAll(HOUSEHOLD_A);
      expect(mockRepo.findBy).toHaveBeenCalledWith({ householdId: HOUSEHOLD_A });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a transaction by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      const result = await service.findOne(TX_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockTx);
    });

    it('should throw NotFoundException if transaction does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(TX_ID, HOUSEHOLD_A)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if transaction belongs to a different household', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      await expect(service.findOne(TX_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ForbiddenException when householdId is null', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      await expect(service.findOne(TX_ID, null as unknown as string)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return transaction when householdId matches', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      const result = await service.findOne(TX_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockTx);
    });
  });

  describe('update', () => {
    it('should update and return the transaction', async () => {
      const updatedTx = { ...mockTx, description: 'Updated' };
      mockRepo.findOneBy.mockResolvedValueOnce(mockTx).mockResolvedValueOnce(updatedTx);
      mockRepo.update.mockResolvedValue(undefined);
      const result = await service.update(TX_ID, HOUSEHOLD_A, { description: 'Updated' });
      expect(mockRepo.update).toHaveBeenCalledWith(TX_ID, { description: 'Updated' });
      expect(result).toEqual(updatedTx);
    });

    it('should throw ForbiddenException when household does not match', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      await expect(service.update(TX_ID, HOUSEHOLD_B, { description: 'X' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should soft-delete the transaction', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      mockRepo.softDelete.mockResolvedValue(undefined);
      await service.softDelete(TX_ID, HOUSEHOLD_A);
      expect(mockRepo.softDelete).toHaveBeenCalledWith(TX_ID);
    });

    it('should throw ForbiddenException when household does not match', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockTx);
      await expect(service.softDelete(TX_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockRepo.softDelete).not.toHaveBeenCalled();
    });
  });
});
