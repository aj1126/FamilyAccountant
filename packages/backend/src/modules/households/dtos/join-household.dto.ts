import { IsUUID } from 'class-validator';

export class JoinHouseholdDto {
  @IsUUID()
  householdId!: string;
}
