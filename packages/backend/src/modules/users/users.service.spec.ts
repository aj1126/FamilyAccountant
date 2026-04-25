import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from '../../entities/user.entity';

const USER_ID = 'aaaa0000-0000-0000-0000-000000000001';
const HOUSEHOLD_ID = 'bbbb0000-0000-0000-0000-000000000002';

const mockUser: Partial<UserEntity> = {
  id: USER_ID,
  email: 'user@example.com',
  passwordHash: 'hashed',
  displayName: 'Alice',
  householdId: null,
};

describe('UsersService', () => {
  let service: UsersService;
  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(UserEntity), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(UsersService);
  });

  describe('findByEmail', () => {
    it('should return a user when found by email', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findByEmail('user@example.com');
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user matches the email', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findByEmail('unknown@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return a user when found by id', async () => {
      mockRepo.findOneBy.mockResolvedValue(mockUser);
      const result = await service.findById(USER_ID);
      expect(mockRepo.findOneBy).toHaveBeenCalledWith({ id: USER_ID });
      expect(result).toEqual(mockUser);
    });

    it('should return null when no user matches the id', async () => {
      mockRepo.findOneBy.mockResolvedValue(null);
      const result = await service.findById(USER_ID);
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and persist a new user', async () => {
      mockRepo.create.mockReturnValue(mockUser);
      mockRepo.save.mockResolvedValue(mockUser);
      const result = await service.create({
        email: 'user@example.com',
        passwordHash: 'hashed',
        displayName: 'Alice',
      });
      expect(mockRepo.create).toHaveBeenCalledWith({
        email: 'user@example.com',
        passwordHash: 'hashed',
        displayName: 'Alice',
      });
      expect(mockRepo.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateHousehold', () => {
    it('should update the householdId for the given user', async () => {
      mockRepo.update.mockResolvedValue(undefined);
      await service.updateHousehold(USER_ID, HOUSEHOLD_ID);
      expect(mockRepo.update).toHaveBeenCalledWith(USER_ID, { householdId: HOUSEHOLD_ID });
    });
  });
});
