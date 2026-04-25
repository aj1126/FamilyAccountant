import { Test, TestingModule } from '@nestjs/testing';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { AccountType } from './dtos/create-account.dto';
import { UserEntity } from '../../entities/user.entity';

const HOUSEHOLD_ID = 'aaaa0000-0000-0000-0000-000000000001';
const ACCOUNT_ID = 'bbbb0000-0000-0000-0000-000000000002';
const USER_ID = 'cccc0000-0000-0000-0000-000000000003';

const mockUser: Partial<UserEntity> = { id: USER_ID, householdId: HOUSEHOLD_ID };

const mockAccount = {
  id: ACCOUNT_ID,
  householdId: HOUSEHOLD_ID,
  name: 'Checking',
  type: AccountType.Checking,
  currency: 'USD',
  balance: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AccountsController', () => {
  let controller: AccountsController;
  let service: jest.Mocked<AccountsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountsController],
      providers: [
        {
          provide: AccountsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AccountsController);
    service = module.get(AccountsService);
  });

  describe('create', () => {
    it('should call service.create with householdId and dto', async () => {
      service.create.mockResolvedValue(mockAccount);
      const dto = { name: 'Checking', type: AccountType.Checking };
      const result = await controller.create(mockUser as UserEntity, dto);
      expect(service.create).toHaveBeenCalledWith(HOUSEHOLD_ID, dto);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with householdId', async () => {
      service.findAll.mockResolvedValue([mockAccount]);
      const result = await controller.findAll(mockUser as UserEntity);
      expect(service.findAll).toHaveBeenCalledWith(HOUSEHOLD_ID);
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with id and householdId', async () => {
      service.findOne.mockResolvedValue(mockAccount);
      const result = await controller.findOne(ACCOUNT_ID, mockUser as UserEntity);
      expect(service.findOne).toHaveBeenCalledWith(ACCOUNT_ID, HOUSEHOLD_ID);
      expect(result).toEqual(mockAccount);
    });
  });

  describe('update', () => {
    it('should call service.update with id, householdId, and dto', async () => {
      const updated = { ...mockAccount, name: 'Savings' };
      service.update.mockResolvedValue(updated);
      const result = await controller.update(ACCOUNT_ID, mockUser as UserEntity, { name: 'Savings' });
      expect(service.update).toHaveBeenCalledWith(ACCOUNT_ID, HOUSEHOLD_ID, { name: 'Savings' });
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should call service.remove with id and householdId', async () => {
      service.remove.mockResolvedValue(undefined);
      await controller.remove(ACCOUNT_ID, mockUser as UserEntity);
      expect(service.remove).toHaveBeenCalledWith(ACCOUNT_ID, HOUSEHOLD_ID);
    });
  });
});
