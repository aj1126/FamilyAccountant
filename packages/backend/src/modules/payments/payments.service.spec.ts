import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentEntity } from '../../entities/payment.entity';

const HOUSEHOLD_A = 'aaaa0000-0000-0000-0000-000000000001';
const HOUSEHOLD_B = 'bbbb0000-0000-0000-0000-000000000002';
const PAYMENT_ID = 'cccc0000-0000-0000-0000-000000000003';
const DEBT_ID = 'dddd0000-0000-0000-0000-000000000004';

const mockPayment: PaymentEntity = {
  id: PAYMENT_ID,
  debtId: DEBT_ID,
  householdId: HOUSEHOLD_A,
  amount: 50,
  currency: 'USD',
  paidAt: new Date('2024-06-01'),
  note: 'Partial payment',
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
};

describe('PaymentsService', () => {
  let service: PaymentsService;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findBy: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(PaymentEntity), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(PaymentsService);
  });

  describe('create', () => {
    it('should create and return a payment', async () => {
      mockRepo.create.mockReturnValue(mockPayment);
      mockRepo.save.mockResolvedValue(mockPayment);
      const result = await service.create(HOUSEHOLD_A, {
        debtId: DEBT_ID,
        amount: 50,
        currency: 'USD',
        paidAt: '2024-06-01',
      });
      expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ householdId: HOUSEHOLD_A }));
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findByDebt', () => {
    it('should return payments for a debt filtered by householdId', async () => {
      mockRepo.findBy.mockResolvedValue([mockPayment]);
      const result = await service.findByDebt(DEBT_ID, HOUSEHOLD_A);
      expect(mockRepo.findBy).toHaveBeenCalledWith({ debtId: DEBT_ID, householdId: HOUSEHOLD_A });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no payments match', async () => {
      mockRepo.findBy.mockResolvedValue([]);
      const result = await service.findByDebt(DEBT_ID, HOUSEHOLD_A);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a payment by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockPayment);
      const result = await service.findOne(PAYMENT_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockPayment);
    });

    it('should throw NotFoundException if payment does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(PAYMENT_ID, HOUSEHOLD_A)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should throw ForbiddenException if payment belongs to a different household', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockPayment);
      await expect(service.findOne(PAYMENT_ID, HOUSEHOLD_B)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should return payment when householdId matches', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockPayment);
      const result = await service.findOne(PAYMENT_ID, HOUSEHOLD_A);
      expect(result).toEqual(mockPayment);
    });
  });
});
