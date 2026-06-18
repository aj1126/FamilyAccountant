import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dtos/create-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/guards/household-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../entities/user.entity';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.householdId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.accountsService.findAll(user.householdId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.accountsService.findOne(id, user.householdId!);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: UserEntity, @Body() dto: Partial<CreateAccountDto>) {
    return this.accountsService.update(id, user.householdId!, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.accountsService.remove(id, user.householdId!);
  }
}
