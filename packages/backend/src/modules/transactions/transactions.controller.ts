import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dtos/create-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HouseholdMemberGuard } from '../../common/guards/household-member.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../entities/user.entity';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, HouseholdMemberGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user.id, user.householdId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.transactionsService.findAll(user.householdId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.transactionsService.findOne(id, user.householdId!);
  }

  @Put(':id')
  update(@Param('id') id: string, @CurrentUser() user: UserEntity, @Body() dto: Partial<CreateTransactionDto>) {
    return this.transactionsService.update(id, user.householdId!, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.transactionsService.softDelete(id, user.householdId!);
  }
}
