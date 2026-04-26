import { Test, TestingModule } from '@nestjs/testing';
import { DebtsController } from './debts.controller';
import { DebtsService } from './debts.service';
import { DebtDirection } from './dtos/create-debt.dto';
import { UserEntity } from '../../entities/user.entity';

const HOUSEHOLD_ID = 'aaaa0000-0000-0000-0000-000000000001';
const DEBT_ID = 'bbbb0000-0000-0000-0000-000000000002';
const USER_ID = 'cccc0000-0000-0000-0000-000000000003';
const CREDITOR_ID = 'dddd0000-0000-0000-0000-000000000004';
const DEBTOR_ID = 'eeee0000-0000-0000-0000-000000000005';

const mockUser: Partial<UserEntity> = { id: USER_ID, householdId: HOUSEHOLD_ID };

const mockDebt = {
  id: DEBT_ID,
  householdId: HOUSEHOLD_ID,
  creditorId: CREDITOR_ID,
  debtorId: DEBTOR_ID,
  amount: 100,
  currency: 'USD',
  description: 'Dinner',
  direction: DebtDirection.OwedToMe,
  settled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('DebtsController', () => {
  let controller: DebtsController;
  let service: jest.Mocked<DebtsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DebtsController],
      providers: [
        {
          provide: DebtsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            settle: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(DebtsController);
    service = module.get(DebtsService);
  });

  describe('create', () => {
    it('should call service.create with householdId and dto', async () => {
      service.create.mockResolvedValue(mockDebt);
      const dto = {
        creditorId: CREDITOR_ID,
        debtorId: DEBTOR_ID,
        amount: 100,
        currency: 'USD',
        description: 'Dinner',
        direction: DebtDirection.OwedToMe,
      };
      const result = await controller.create(mockUser as UserEntity, dto);
      expect(service.create).toHaveBeenCalledWith(HOUSEHOLD_ID, dto);
      expect(result).toEqual(mockDebt);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with householdId', async () => {
      service.findAll.mockResolvedValue([mockDebt]);
      const result = await controller.findAll(mockUser as UserEntity);
      expect(service.findAll).toHaveBeenCalledWith(HOUSEHOLD_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and householdId', async () => {
      service.findOne.mockResolvedValue(mockDebt);
      const result = await controller.findOne(DEBT_ID, mockUser as UserEntity);
      expect(service.findOne).toHaveBeenCalledWith(DEBT_ID, HOUSEHOLD_ID);
      expect(result).toEqual(mockDebt);
    });
  });

  describe('settle', () => {
    it('should call service.settle with id and householdId', async () => {
      const settledDebt = { ...mockDebt, settled: true };
      service.settle.mockResolvedValue(settledDebt);
      const result = await controller.settle(DEBT_ID, mockUser as UserEntity);
      expect(service.settle).toHaveBeenCalledWith(DEBT_ID, HOUSEHOLD_ID);
      expect(result).toEqual(settledDebt);
    });
  });
});
