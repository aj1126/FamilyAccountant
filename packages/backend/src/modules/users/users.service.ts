import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ email });
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.repo.findOneBy({ id });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    displayName: string;
  }): Promise<UserEntity> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async updateHousehold(userId: string, householdId: string): Promise<void> {
    await this.repo.update(userId, { householdId });
  }
}
