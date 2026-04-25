import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: string): Promise<AccountEntity> {
    const account = await this.repo.findOneBy({ id });
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  async update(id: string, dto: Partial<CreateAccountDto>): Promise<AccountEntity> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
