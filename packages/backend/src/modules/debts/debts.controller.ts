import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DebtsService } from './debts.service';
import { CreateDebtDto } from './dtos/create-debt.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../entities/user.entity';

@ApiTags('debts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('debts')
export class DebtsController {
  constructor(private readonly debtsService: DebtsService) {}

  @Post()
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateDebtDto) {
    return this.debtsService.create(user.householdId!, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserEntity) {
    return this.debtsService.findAll(user.householdId!);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.debtsService.findOne(id, user.householdId!);
  }

  @Patch(':id/settle')
  settle(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.debtsService.settle(id, user.householdId!);
  }
}
