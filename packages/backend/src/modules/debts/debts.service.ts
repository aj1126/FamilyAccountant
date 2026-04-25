import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebtEntity } from '../../entities/debt.entity';
import { CreateDebtDto } from './dtos/create-debt.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(DebtEntity)
    private readonly repo: Repository<DebtEntity>,
  ) {}

  async create(householdId: string, dto: CreateDebtDto): Promise<DebtEntity> {
    const debt = this.repo.create({ ...dto, householdId });
    return this.repo.save(debt);
  }

  async findAll(householdId: string): Promise<DebtEntity[]> {
    return this.repo.findBy({ householdId });
  }

  async findOne(id: string): Promise<DebtEntity> {
    const debt = await this.repo.findOneBy({ id });
    if (!debt) throw new NotFoundException('Debt not found');
    return debt;
  }

  async settle(id: string): Promise<DebtEntity> {
    await this.repo.update(id, { settled: true });
    return this.findOne(id);
  }
}
