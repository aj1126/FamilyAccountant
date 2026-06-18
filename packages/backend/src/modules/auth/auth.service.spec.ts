import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockUser = {
  id: 'uuid-1',
  email: 'test@example.com',
  passwordHash: '',
  displayName: 'Test',
  householdId: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token'), verify: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('secret'),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should throw ConflictException if email exists on register', async () => {
    usersService.findByEmail.mockResolvedValue(mockUser as never);
    await expect(
      service.register({ email: 'test@example.com', password: 'pass1234', displayName: 'T' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should register new user and return tokens', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue(mockUser as never);
    const result = await service.register({
      email: 'new@example.com',
      password: 'pass1234',
      displayName: 'New',
    });
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
  });

  it('should throw UnauthorizedException for invalid login', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'x@x.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should throw UnauthorizedException when password does not match', async () => {
    const hash = await bcrypt.hash('correct-password', 1);
    usersService.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash } as never);
    await expect(
      service.login({ email: 'test@example.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should login successfully with correct credentials', async () => {
    const hash = await bcrypt.hash('pass1234', 1);
    usersService.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash } as never);
    const result = await service.login({ email: 'test@example.com', password: 'pass1234' });
    expect(result).toHaveProperty('accessToken');
    expect(jwtService.sign).toHaveBeenCalled();
  });

  describe('refresh', () => {
    it('should return new tokens when refresh token is valid', async () => {
      jwtService.verify.mockReturnValue({ sub: 'uuid-1', email: 'test@example.com' } as never);
      usersService.findById.mockResolvedValue(mockUser as never);
      const result = await service.refresh('valid-refresh-token');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('userId');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jwtService.verify.mockImplementation(() => { throw new Error('jwt expired'); });
      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is not found after token verification', async () => {
      jwtService.verify.mockReturnValue({ sub: 'missing-id', email: 'x@x.com' } as never);
      usersService.findById.mockResolvedValue(null);
      await expect(service.refresh('valid-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
