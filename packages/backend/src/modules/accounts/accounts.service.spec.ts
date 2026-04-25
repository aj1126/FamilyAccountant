import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountEntity } from '../../entities/account.entity';
import { AccountType } from './dtos/create-account.dto';

const HOUSEHOLD_A = 'aaaa0000-0000-0000-0000-000000000001';
const HOUSEHOLD_B = 'bbbb0000-0000-0000-0000-000000000002';
const ACCOUNT_ID = 'cccc0000-0000-0000-0000-000000000003';

const mockAccount: AccountEntity = {
  id: ACCOUNT_ID,
  householdId: HOUSEHOLD_A,
  name: 'Checking',
  type: AccountType.Checking,
  currency: 'USD',
  balance: 100,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('AccountsService', () => {
  let service: AccountsService;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        { provide: getRepositoryToken(AccountEntity), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(AccountsService);
  });

  describe('create', () => {
    it('should create and return an account', async () => {
      mockRepo.create.mockReturnValue(mockAccount);
      mockRepo.save.mockResolvedValue(mockAccount);
      const result = await service.create(HOUSEHOLD_A, {
        name: 'Checking',
        type: AccountType.Checking,
      });
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ householdId: HOUSEHOLD_A }));
      expect(result).toEqual(mockAccount);
    });
  });

  describe('findAll', () => {
    it('should return accounts for the given household', async () => {
      mockRepo.findBy.mockResolvedValue([mockAccount]);
      const result = await service.findAll(HOUSEHOLD_A);
      expect(mockRepo.findBy).toHaveBeenCalledWith({ householdId: HOUSEHOLD_A });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return an account by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      const result = await service.findOne(ACCOUNT_ID);
      expect(result).toEqual(mockAccount);
    });

    it('should throw NotFoundException if account does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(ACCOUNT_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if account belongs to a different household', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      await expect(service.findOne(ACCOUNT_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return the account when householdId matches', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      const result = await service.findOne(ACCOUNT_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('should update and return the account', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      mockRepo.update.mockResolvedValue(undefined);
      const updated = { ...mockAccount, name: 'Savings' };
      mockRepo.findOneBy.mockResolvedValueOnce(mockAccount).mockResolvedValueOnce(updated);
      const result = await service.update(ACCOUNT_ID, HOUSEHOLD_A, { name: 'Savings' });
      expect(mockRepo.update).toHaveBeenCalledWith(ACCOUNT_ID, { name: 'Savings' });
      expect(result).toEqual(updated);
    });

    it('should throw ForbiddenException when household does not match', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      await expect(service.update(ACCOUNT_ID, HOUSEHOLD_B, { name: 'X' })).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete the account', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      mockRepo.delete.mockResolvedValue(undefined);
      await service.remove(ACCOUNT_ID, HOUSEHOLD_A);
      expect(mockRepo.delete).toHaveBeenCalledWith(ACCOUNT_ID);
    });

    it('should throw ForbiddenException when household does not match', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockAccount);
      await expect(service.remove(ACCOUNT_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockRepo.delete).not.toHaveBeenCalled();
    });
  });
});
