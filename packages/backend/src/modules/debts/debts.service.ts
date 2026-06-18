import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DebtEntity } from '../../entities/debt.entity';
import { UserEntity } from '../../entities/user.entity';
import { CreateDebtDto } from './dtos/create-debt.dto';

@Injectable()
export class DebtsService {
  constructor(
    @InjectRepository(DebtEntity)
    private readonly repo: Repository<DebtEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async create(householdId: string, dto: CreateDebtDto): Promise<DebtEntity> {
    if (dto.creditorId === dto.debtorId) {
      throw new ForbiddenException('Creditor and debtor cannot be the same user');
    }

    const [creditor, debtor] = await Promise.all([
      this.userRepo.findOneBy({ id: dto.creditorId }),
      this.userRepo.findOneBy({ id: dto.debtorId }),
    ]);

    if (!creditor || !debtor) {
      throw new NotFoundException('Creditor or debtor user not found');
    }

    if (creditor.householdId !== householdId || debtor.householdId !== householdId) {
      throw new ForbiddenException('Both creditor and debtor must belong to your household');
    }

    const debt = this.repo.create({ ...dto, householdId });
    return this.repo.save(debt);
  }

  async findAll(householdId: string): Promise<DebtEntity[]> {
    return this.repo.findBy({ householdId });
  }

  async findOne(id: string, householdId: string): Promise<DebtEntity> {
    const debt = await this.repo.findOneBy({ id });
    if (!debt) throw new NotFoundException('Debt not found');
    if (householdId == null) throw new ForbiddenException('Access denied');
    if (debt.householdId !== householdId) throw new ForbiddenException('Access denied');
    return debt;
  }

  async settle(id: string, householdId: string): Promise<DebtEntity> {
    await this.findOne(id, householdId);
    await this.repo.update(id, { settled: true });
    return this.findOne(id, householdId);
  }
}
