import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HouseholdEntity } from '../../entities/household.entity';
import { UsersService } from '../users/users.service';
import { CreateHouseholdDto } from './dtos/create-household.dto';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectRepository(HouseholdEntity)
    private readonly repo: Repository<HouseholdEntity>,
    private readonly usersService: UsersService,
  ) {}

  async create(ownerId: string, dto: CreateHouseholdDto): Promise<HouseholdEntity> {
    const household = this.repo.create({ name: dto.name, ownerId });
    const saved = await this.repo.save(household);
    await this.usersService.updateHousehold(ownerId, saved.id);
    return saved;
  }

  async findById(id: string): Promise<HouseholdEntity | null> {
    return this.repo.findOneBy({ id });
  }

  async getHousehold(householdId: string, requesterId: string) {
    const household = await this.findById(householdId);
    if (!household || household.ownerId !== requesterId) {
      throw new ForbiddenException();
    }
    return household;
  }
}
