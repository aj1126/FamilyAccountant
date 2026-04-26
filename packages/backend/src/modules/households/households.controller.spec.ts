import { Test, TestingModule } from '@nestjs/testing';
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

  describe('findOne', () => {
    it('should call service.getHousehold with id and userId', async () => {
      service.getHousehold.mockResolvedValue(mockHousehold);
      const result = await controller.findOne(HOUSEHOLD_ID, mockUser as UserEntity);
      expect(service.getHousehold).toHaveBeenCalledWith(HOUSEHOLD_ID, OWNER_ID);
      expect(result).toEqual(mockHousehold);
    });
  });
});
