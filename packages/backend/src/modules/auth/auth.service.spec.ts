import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
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
          useValue: { sign: jest.fn().mockReturnValue('token') },
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

  it('should login successfully with correct credentials', async () => {
    const hash = await bcrypt.hash('pass1234', 1);
    usersService.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash } as never);
    const result = await service.login({ email: 'test@example.com', password: 'pass1234' });
    expect(result).toHaveProperty('accessToken');
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
