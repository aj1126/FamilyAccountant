import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../../entities/account.entity';
import { CreateAccountDto } from './dtos/create-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly repo: Repository<AccountEntity>,
  ) {}

  async create(householdId: string, dto: CreateAccountDto): Promise<AccountEntity> {
    const account = this.repo.create({ ...dto, householdId });
    return this.repo.save(account);
  }

  async findAll(householdId: string): Promise<AccountEntity[]> {
    return this.repo.findBy({ householdId });
  }

  async findOne(id: string, householdId?: string): Promise<AccountEntity> {
    const account = await this.repo.findOneBy({ id });
    if (!account) throw new NotFoundException('Account not found');
    if (householdId && account.householdId !== householdId) throw new ForbiddenException('Access denied');
    return account;
  }

  async update(id: string, householdId: string, dto: Partial<CreateAccountDto>): Promise<AccountEntity> {
    await this.findOne(id, householdId);
    await this.repo.update(id, dto);
    return this.findOne(id, householdId);
  }

  async remove(id: string, householdId: string): Promise<void> {
    await this.findOne(id, householdId);
    await this.repo.delete(id);
  }
}
