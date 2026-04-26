import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto } from './dtos/create-household.dto';
import { JoinHouseholdDto } from './dtos/join-household.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../entities/user.entity';

@ApiTags('households')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateHouseholdDto) {
    return this.householdsService.create(user.id, dto);
  }

  @Post('join')
  join(@CurrentUser() user: UserEntity, @Body() dto: JoinHouseholdDto) {
    return this.householdsService.join(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.householdsService.getHousehold(id, user.id);
  }
}
