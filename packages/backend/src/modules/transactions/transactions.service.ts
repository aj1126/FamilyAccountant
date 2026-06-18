import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';
import { AccountEntity } from '../../entities/account.entity';
import { CreateTransactionDto } from './dtos/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  private async validateAccount(accountId: string | null | undefined, householdId: string): Promise<AccountEntity | null> {
    if (!accountId) return null;
    const account = await this.accountRepo.findOneBy({ id: accountId });
    if (!account) throw new NotFoundException('Account not found');
    if (account.householdId !== householdId) {
      throw new ForbiddenException('Account does not belong to your household');
    }
    return account;
  }

  private async adjustAccountBalance(accountId: string | null | undefined, delta: number): Promise<void> {
    if (!accountId) return;
    const account = await this.accountRepo.findOneBy({ id: accountId });
    if (!account) return;
    account.balance = Number(account.balance) + delta;
    await this.accountRepo.save(account);
  }

  async create(
    userId: string,
    householdId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionEntity> {
    if (dto.accountId) {
      await this.validateAccount(dto.accountId, householdId);
    }
    const tx = this.repo.create({ ...dto, userId, householdId, syncStatus: 'synced' });
    const saved = await this.repo.save(tx);
    
    // Adjust account balance (signed transaction amount)
    await this.adjustAccountBalance(dto.accountId, dto.amount);
    
    return saved;
  }

  async findAll(householdId: string): Promise<TransactionEntity[]> {
    return this.repo.findBy({ householdId });
  }

  async findOne(id: string, householdId: string): Promise<TransactionEntity> {
    const tx = await this.repo.findOneBy({ id });
    if (!tx) throw new NotFoundException('Transaction not found');
    if (householdId == null) throw new ForbiddenException('Access denied');
    if (tx.householdId !== householdId) throw new ForbiddenException('Access denied');
    return tx;
  }

  async update(id: string, householdId: string, dto: Partial<CreateTransactionDto>): Promise<TransactionEntity> {
    const tx = await this.findOne(id, householdId);
    
    const targetAccountId = dto.accountId !== undefined ? dto.accountId : tx.accountId;
    if (targetAccountId) {
      await this.validateAccount(targetAccountId, householdId);
    }

    const oldAmount = tx.amount;
    const oldAccountId = tx.accountId;
    const newAmount = dto.amount !== undefined ? dto.amount : tx.amount;
    const newAccountId = dto.accountId !== undefined ? dto.accountId : tx.accountId;

    await this.repo.update(id, dto);
    const updated = await this.findOne(id, householdId);

    // Adjust balances:
    if (oldAccountId !== newAccountId) {
      // Refund old account
      await this.adjustAccountBalance(oldAccountId, -oldAmount);
      // Charge new account
      await this.adjustAccountBalance(newAccountId, newAmount);
    } else if (oldAmount !== newAmount) {
      // Same account, different amount: adjust by delta
      await this.adjustAccountBalance(oldAccountId, newAmount - oldAmount);
    }

    return updated;
  }

  async softDelete(id: string, householdId: string): Promise<void> {
    const tx = await this.findOne(id, householdId);
    await this.repo.softDelete(id);
    
    // Adjust account balance (refund transaction amount)
    await this.adjustAccountBalance(tx.accountId, -tx.amount);
  }
}
