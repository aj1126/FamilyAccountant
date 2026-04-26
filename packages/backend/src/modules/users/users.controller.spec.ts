import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UserEntity } from '../../entities/user.entity';

const mockUser: Partial<UserEntity> = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed-secret',
  displayName: 'Alice',
  householdId: 'household-1',
};

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    }).compile();

    controller = module.get(UsersController);
  });

  describe('getMe', () => {
    it('should return the current user without the passwordHash field', () => {
      const result = controller.getMe(mockUser as UserEntity);
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Alice',
        householdId: 'household-1',
      });
    });
  });
});
