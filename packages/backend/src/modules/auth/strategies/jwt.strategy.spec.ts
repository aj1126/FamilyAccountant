import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hash',
  displayName: 'Test',
  householdId: null,
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn().mockReturnValue('test-secret') },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it('should return the user when found', async () => {
    usersService.findById.mockResolvedValue(mockUser as never);
    const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com' });
    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(mockUser);
  });

  it('should throw UnauthorizedException when user is not found', async () => {
    usersService.findById.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 'missing', email: 'missing@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
