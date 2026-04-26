import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { HouseholdsController } from './households.controller';
import { HouseholdsService } from './households.service';
import { UserEntity } from '../../entities/user.entity';

const OWNER_ID = 'aaaa0000-0000-0000-0000-000000000001';
const HOUSEHOLD_ID = 'bbbb0000-0000-0000-0000-000000000002';

const mockUser: Partial<UserEntity> = { id: OWNER_ID, householdId: HOUSEHOLD_ID };

const mockHousehold = {
  id: HOUSEHOLD_ID,
  name: 'Smith Family',
  ownerId: OWNER_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('HouseholdsController', () => {
  let controller: HouseholdsController;
  let service: jest.Mocked<HouseholdsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HouseholdsController],
      providers: [
        {
          provide: HouseholdsService,
          useValue: {
            create: jest.fn(),
            join: jest.fn(),
            getHousehold: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(HouseholdsController);
    service = module.get(HouseholdsService);
  });

  describe('create', () => {
    it('should call service.create with userId and dto', async () => {
      service.create.mockResolvedValue(mockHousehold);
      const dto = { name: 'Smith Family' };
      const result = await controller.create(mockUser as UserEntity, dto);
      expect(service.create).toHaveBeenCalledWith(OWNER_ID, dto);
      expect(result).toEqual(mockHousehold);
    });
  });

  describe('join', () => {
    it('should call service.join with userId and dto', async () => {
      service.join.mockResolvedValue(mockHousehold);
      const dto = { householdId: HOUSEHOLD_ID };
      const result = await controller.join(mockUser as UserEntity, dto);
      expect(service.join).toHaveBeenCalledWith(OWNER_ID, dto);
      expect(result).toEqual(mockHousehold);
    });

    it('should propagate NotFoundException from service', async () => {
      service.join.mockRejectedValue(new NotFoundException('Household not found'));
      await expect(
        controller.join(mockUser as UserEntity, { householdId: 'non-existent-id' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('should propagate ConflictException from service when user already has a household', async () => {
      service.join.mockRejectedValue(new ConflictException('User is already a member of a household'));
      await expect(
        controller.join(mockUser as UserEntity, { householdId: HOUSEHOLD_ID }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should call service.getHousehold with id and userId', async () => {
      service.getHousehold.mockResolvedValue(mockHousehold);
      const result = await controller.findOne(HOUSEHOLD_ID, mockUser as UserEntity);
      expect(service.getHousehold).toHaveBeenCalledWith(HOUSEHOLD_ID, OWNER_ID);
      expect(result).toEqual(mockHousehold);
    });
  });
});
