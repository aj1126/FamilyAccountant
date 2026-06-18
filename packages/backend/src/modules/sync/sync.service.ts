import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';
import { AccountEntity } from '../../entities/account.entity';
import { SyncPayload } from '@family-accountant/shared';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  private async adjustAccountBalance(accountId: string | null | undefined, delta: number): Promise<void> {
    if (!accountId) return;
    const account = await this.accountRepo.findOneBy({ id: accountId });
    if (!account) return;
    account.balance = Number(account.balance) + delta;
    await this.accountRepo.save(account);
  }

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
        if (!incoming.deletedAt) {
          await this.adjustAccountBalance(incoming.accountId, incoming.amount);
        }
      } else {
        const incomingUpdated = new Date(incoming.updatedAt);
        if (incomingUpdated > existing.updatedAt) {
          const oldDeleted = !!existing.deletedAt;
          const newDeleted = !!incoming.deletedAt;

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

          // Adjust account balance based on status transition:
          if (oldDeleted && !newDeleted) {
            // Un-deleted: charge the incoming amount
            await this.adjustAccountBalance(incoming.accountId, incoming.amount);
          } else if (!oldDeleted && newDeleted) {
            // Deleted: refund the old amount
            await this.adjustAccountBalance(existing.accountId, -existing.amount);
          } else if (!oldDeleted && !newDeleted) {
            // Both active: check if account changed or amount changed
            if (existing.accountId !== incoming.accountId) {
              await this.adjustAccountBalance(existing.accountId, -existing.amount);
              await this.adjustAccountBalance(incoming.accountId, incoming.amount);
            } else if (Number(existing.amount) !== Number(incoming.amount)) {
              await this.adjustAccountBalance(existing.accountId, incoming.amount - existing.amount);
            }
          }
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

