import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';
import { SyncPayload } from '@family-accountant/shared';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
  ) {}

  async sync(
    householdId: string,
    userId: string,
    payload: SyncPayload,
  ): Promise<{ transactions: TransactionEntity[]; syncedAt: string }> {
    for (const incoming of payload.transactions) {
      const existing = await this.txRepo.findOne({
        where: { localId: incoming.localId },
        withDeleted: true,
      });

      if (!existing) {
        await this.txRepo.save(
          this.txRepo.create({
            localId: incoming.localId,
            accountId: incoming.accountId,
            householdId,
            userId,
            amount: incoming.amount,
            currency: incoming.currency,
            description: incoming.description,
            category: incoming.category,
            transactionDate: incoming.transactionDate,
            syncStatus: 'synced',
            createdAt: new Date(incoming.createdAt),
            updatedAt: new Date(incoming.updatedAt),
            deletedAt: incoming.deletedAt ? new Date(incoming.deletedAt) : null,
          }),
        );
      } else {
        const incomingUpdated = new Date(incoming.updatedAt);
        if (incomingUpdated > existing.updatedAt) {
          await this.txRepo.save({
            ...existing,
            accountId: incoming.accountId,
            amount: incoming.amount,
            description: incoming.description,
            category: incoming.category,
            transactionDate: incoming.transactionDate,
            updatedAt: incomingUpdated,
            deletedAt: incoming.deletedAt ? new Date(incoming.deletedAt) : null,
          });
        }
      }
    }

    const since = payload.lastSyncedAt ? new Date(payload.lastSyncedAt) : new Date(0);
    const serverDelta = await this.txRepo.find({
      where: { householdId, updatedAt: MoreThan(since) },
      withDeleted: true,
    });

    return { transactions: serverDelta, syncedAt: new Date().toISOString() };
  }
}


