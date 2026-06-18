import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DebtsService } from './debts.service';
import { DebtEntity } from '../../entities/debt.entity';
import { UserEntity } from '../../entities/user.entity';
import { DebtDirection } from './dtos/create-debt.dto';

const HOUSEHOLD_A = 'aaaa0000-0000-0000-0000-000000000001';
const HOUSEHOLD_B = 'bbbb0000-0000-0000-0000-000000000002';
const DEBT_ID = 'cccc0000-0000-0000-0000-000000000003';
const CREDITOR_ID = 'dddd0000-0000-0000-0000-000000000004';
const DEBTOR_ID = 'eeee0000-0000-0000-0000-000000000005';

const mockDebt: DebtEntity = {
  id: DEBT_ID,
  householdId: HOUSEHOLD_A,
  creditorId: CREDITOR_ID,
  debtorId: DEBTOR_ID,
  amount: 200,
  currency: 'USD',
  description: 'Dinner',
  direction: DebtDirection.OwedToMe,
  settled: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('DebtsService', () => {
  let service: DebtsService;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };
  const mockUserRepo = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DebtsService,
        { provide: getRepositoryToken(DebtEntity), useValue: mockRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo },
      ],
    }).compile();
    service = module.get(DebtsService);
  });

  describe('create', () => {
    it('should create and return a debt', async () => {
      mockUserRepo.findOneBy.mockImplementation(({ id }) => {
        if (id === CREDITOR_ID) return Promise.resolve({ id: CREDITOR_ID, householdId: HOUSEHOLD_A });
        if (id === DEBTOR_ID) return Promise.resolve({ id: DEBTOR_ID, householdId: HOUSEHOLD_A });
        return Promise.resolve(null);
      });
      mockRepo.create.mockReturnValue(mockDebt);
      mockRepo.save.mockResolvedValue(mockDebt);
      const result = await service.create(HOUSEHOLD_A, {
        creditorId: CREDITOR_ID,
        debtorId: DEBTOR_ID,
        amount: 200,
        currency: 'USD',
        description: 'Dinner',
        direction: DebtDirection.OwedToMe,
      });
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ householdId: HOUSEHOLD_A }));
      expect(result).toEqual(mockDebt);
    });

    it('should throw ForbiddenException if creditor and debtor are identical', async () => {
      await expect(service.create(HOUSEHOLD_A, {
        creditorId: CREDITOR_ID,
        debtorId: CREDITOR_ID,
        amount: 200,
        currency: 'USD',
        description: 'Self debt',
        direction: DebtDirection.OwedToMe,
      })).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ForbiddenException if creditor belongs to a different household', async () => {
      mockUserRepo.findOneBy.mockImplementation(({ id }) => {
        if (id === CREDITOR_ID) return Promise.resolve({ id: CREDITOR_ID, householdId: HOUSEHOLD_B });
        if (id === DEBTOR_ID) return Promise.resolve({ id: DEBTOR_ID, householdId: HOUSEHOLD_A });
        return Promise.resolve(null);
      });
      await expect(service.create(HOUSEHOLD_A, {
        creditorId: CREDITOR_ID,
        debtorId: DEBTOR_ID,
        amount: 200,
        currency: 'USD',
        description: 'Cross debt',
        direction: DebtDirection.OwedToMe,
      })).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return debts for the given household', async () => {
      mockRepo.findBy.mockResolvedValue([mockDebt]);
      const result = await service.findAll(HOUSEHOLD_A);
      expect(mockRepo.findBy).toHaveBeenCalledWith({ householdId: HOUSEHOLD_A });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a debt by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockDebt);
      const result = await service.findOne(DEBT_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockDebt);
    });

    it('should throw NotFoundException if debt does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(DEBT_ID, HOUSEHOLD_A)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if debt belongs to a different household', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockDebt);
      await expect(service.findOne(DEBT_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw ForbiddenException when householdId is null', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockDebt);
      await expect(service.findOne(DEBT_ID, null as unknown as string)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return debt when householdId matches', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockDebt);
      const result = await service.findOne(DEBT_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockDebt);
    });
  });

  describe('settle', () => {
    it('should mark the debt as settled', async () => {
      const settledDebt = { ...mockDebt, settled: true };
      mockRepo.findOneBy.mockResolvedValueOnce(mockDebt).mockResolvedValueOnce(settledDebt);
      mockRepo.update.mockResolvedValue(undefined);
      const result = await service.settle(DEBT_ID, HOUSEHOLD_A);
      expect(mockRepo.update).toHaveBeenCalledWith(DEBT_ID, { settled: true });
      expect(result.settled).toBe(true);
    });

    it('should throw ForbiddenException when household does not match', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockDebt);
      await expect(service.settle(DEBT_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });
});
