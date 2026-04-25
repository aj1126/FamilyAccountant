import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token', userId: 'user-1' };

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  describe('register', () => {
    it('should call authService.register and return tokens', async () => {
      authService.register.mockResolvedValue(mockTokens);
      const dto = { email: 'test@example.com', password: 'pass1234', displayName: 'Test' };
      const result = await controller.register(dto);
      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      authService.login.mockResolvedValue(mockTokens);
      const dto = { email: 'test@example.com', password: 'pass1234' };
      const result = await controller.login(dto);
      expect(authService.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockTokens);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh with the token and return new tokens', async () => {
      authService.refresh.mockResolvedValue(mockTokens);
      const result = await controller.refresh({ refreshToken: 'old-refresh-token' });
      expect(authService.refresh).toHaveBeenCalledWith('old-refresh-token');
      expect(result).toEqual(mockTokens);
    });
  });
});
