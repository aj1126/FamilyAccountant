import { Test, TestingModule } from '@nestjs/testing';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { UserEntity } from '../../entities/user.entity';

const HOUSEHOLD_ID = 'aaaa0000-0000-0000-0000-000000000001';
const USER_ID = 'bbbb0000-0000-0000-0000-000000000002';

const mockUser: Partial<UserEntity> = { id: USER_ID, householdId: HOUSEHOLD_ID };

const mockSyncResult = {
  transactions: [],
  syncedAt: new Date().toISOString(),
};

describe('SyncController', () => {
  let controller: SyncController;
  let service: jest.Mocked<SyncService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SyncController],
      providers: [
        {
          provide: SyncService,
          useValue: { sync: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(SyncController);
    service = module.get(SyncService);
  });

  describe('sync', () => {
    it('should call service.sync with householdId, userId, and payload', async () => {
      service.sync.mockResolvedValue(mockSyncResult);
      const payload = { transactions: [], lastSyncedAt: null };
      const result = await controller.sync(mockUser as UserEntity, payload);
      expect(service.sync).toHaveBeenCalledWith(HOUSEHOLD_ID, USER_ID, payload);
      expect(result).toEqual(mockSyncResult);
    });
  });
});
