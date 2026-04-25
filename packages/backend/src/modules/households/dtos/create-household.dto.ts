import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateHouseholdDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}
