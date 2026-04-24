import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionEntity } from '../../entities/transaction.entity';
import { CreateTransactionDto } from './dtos/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly repo: Repository<TransactionEntity>,
  ) {}

  async create(
    userId: string,
    householdId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionEntity> {
    const tx = this.repo.create({ ...dto, userId, householdId, syncStatus: 'synced' });
    return this.repo.save(tx);
  }

  async findAll(householdId: string): Promise<TransactionEntity[]> {
    return this.repo.findBy({ householdId });
  }

  async findOne(id: string): Promise<TransactionEntity> {
    const tx = await this.repo.findOneBy({ id });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }

  async update(id: string, dto: Partial<CreateTransactionDto>): Promise<TransactionEntity> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
