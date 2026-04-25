import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UserEntity } from '../../entities/user.entity';

const HOUSEHOLD_ID = 'aaaa0000-0000-0000-0000-000000000001';
const PAYMENT_ID = 'bbbb0000-0000-0000-0000-000000000002';
const DEBT_ID = 'cccc0000-0000-0000-0000-000000000003';
const USER_ID = 'dddd0000-0000-0000-0000-000000000004';

const mockUser: Partial<UserEntity> = { id: USER_ID, householdId: HOUSEHOLD_ID };

const mockPayment = {
  id: PAYMENT_ID,
  debtId: DEBT_ID,
  householdId: HOUSEHOLD_ID,
  amount: 50,
  currency: 'USD',
  paidAt: new Date('2024-06-01'),
  note: 'Half payment',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            create: jest.fn(),
            findByDebt: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(PaymentsController);
    service = module.get(PaymentsService);
  });

  describe('create', () => {
    it('should call service.create with householdId and dto', async () => {
      service.create.mockResolvedValue(mockPayment);
      const dto = { debtId: DEBT_ID, amount: 50, currency: 'USD', paidAt: '2024-06-01' };
      const result = await controller.create(mockUser as UserEntity, dto);
      expect(service.create).toHaveBeenCalledWith(HOUSEHOLD_ID, dto);
      expect(result).toEqual(mockPayment);
    });
  });

  describe('findByDebt', () => {
    it('should call service.findByDebt with debtId and householdId', async () => {
      service.findByDebt.mockResolvedValue([mockPayment]);
      const result = await controller.findByDebt(DEBT_ID, mockUser as UserEntity);
      expect(service.findByDebt).toHaveBeenCalledWith(DEBT_ID, HOUSEHOLD_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and householdId', async () => {
      service.findOne.mockResolvedValue(mockPayment);
      const result = await controller.findOne(PAYMENT_ID, mockUser as UserEntity);
      expect(service.findOne).toHaveBeenCalledWith(PAYMENT_ID, HOUSEHOLD_ID);
      expect(result).toEqual(mockPayment);
    });
  });
});
