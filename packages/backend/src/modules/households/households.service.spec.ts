import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { HouseholdsService } from './households.service';
import { HouseholdEntity } from '../../entities/household.entity';
import { UsersService } from '../users/users.service';

const OWNER_ID = 'aaaa0000-0000-0000-0000-000000000001';
const OTHER_USER_ID = 'bbbb0000-0000-0000-0000-000000000002';
const HOUSEHOLD_ID = 'cccc0000-0000-0000-0000-000000000003';

const mockHousehold: HouseholdEntity = {
  id: HOUSEHOLD_ID,
  name: 'Smith Family',
  ownerId: OWNER_ID,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

describe('HouseholdsService', () => {
  let service: HouseholdsService;
  let usersService: jest.Mocked<UsersService>;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HouseholdsService,
        { provide: getRepositoryToken(HouseholdEntity), useValue: mockRepo },
        {
          provide: UsersService,
          useValue: { findById: jest.fn(), updateHousehold: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(HouseholdsService);
    usersService = module.get(UsersService);
  });

  describe('create', () => {
    it('should create a household and update the owner household assignment', async () => {
      mockRepo.create.mockReturnValue(mockHousehold);
      mockRepo.save.mockResolvedValue(mockHousehold);
      usersService.updateHousehold.mockResolvedValue(undefined);

      const result = await service.create(OWNER_ID, { name: 'Smith Family' });

      expect(mockRepo.create).toHaveBeenCalledWith({ name: 'Smith Family', ownerId: OWNER_ID });
      expect(mockRepo.save).toHaveBeenCalledWith(mockHousehold);
      expect(usersService.updateHousehold).toHaveBeenCalledWith(OWNER_ID, HOUSEHOLD_ID);
      expect(result).toEqual(mockHousehold);
    });
  });

  describe('findById', () => {
    it('should return a household by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockHousehold);
      const result = await service.findById(HOUSEHOLD_ID);
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: HOUSEHOLD_ID });
      expect(result).toEqual(mockHousehold);
    });

    it('should return null when household does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findById(HOUSEHOLD_ID);
      expect(result).toBeNull();
    });
  });

  describe('getHousehold', () => {
    it('should return the household when requester is the owner', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockHousehold);
      const result = await service.getHousehold(HOUSEHOLD_ID, OWNER_ID);
      expect(result).toEqual(mockHousehold);
    });

    it('should throw ForbiddenException when requester is not the owner', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockHousehold);
      await expect(service.getHousehold(HOUSEHOLD_ID, OTHER_USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('should throw NotFoundException when household does not exist', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      await expect(service.getHousehold(HOUSEHOLD_ID, OWNER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('join', () => {
    it('should join a household and update the user household assignment', async () => {
      usersService.findById.mockResolvedValue({ id: OTHER_USER_ID, householdId: null } as any);
      mockRepo.findOneBy.mockResolvedValue(mockHousehold);
      usersService.updateHousehold.mockResolvedValue(undefined);

      const result = await service.join(OTHER_USER_ID, { householdId: HOUSEHOLD_ID });

      expect(usersService.findById).toHaveBeenCalledWith(OTHER_USER_ID);
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: HOUSEHOLD_ID });
      expect(usersService.updateHousehold).toHaveBeenCalledWith(OTHER_USER_ID, HOUSEHOLD_ID);
      expect(result).toEqual(mockHousehold);
    });

    it('should throw ConflictException when user is already in a household', async () => {
      usersService.findById.mockResolvedValue({ id: OWNER_ID, householdId: HOUSEHOLD_ID } as any);

      await expect(service.join(OWNER_ID, { householdId: HOUSEHOLD_ID })).rejects.toBeInstanceOf(ConflictException);
      expect(usersService.updateHousehold).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when household does not exist', async () => {
      usersService.findById.mockResolvedValue({ id: OTHER_USER_ID, householdId: null } as any);
      mockRepo.findOneBy.mockResolvedValue(null);

      await expect(service.join(OTHER_USER_ID, { householdId: HOUSEHOLD_ID })).rejects.toBeInstanceOf(NotFoundException);
      expect(usersService.updateHousehold).not.toHaveBeenCalled();
    });
  });
});
