import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { TransactionEntity } from '../../entities/transaction.entity';
import { AccountEntity } from '../../entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TransactionEntity, AccountEntity])],
  providers: [SyncService],
  controllers: [SyncController],
})
export class SyncModule {}
