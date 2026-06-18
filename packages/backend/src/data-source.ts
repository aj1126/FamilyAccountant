import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { HouseholdEntity } from './entities/household.entity';
import { AccountEntity } from './entities/account.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { DebtEntity } from './entities/debt.entity';
import { PaymentEntity } from './entities/payment.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    UserEntity,
    HouseholdEntity,
    AccountEntity,
    TransactionEntity,
    DebtEntity,
    PaymentEntity,
  ],
  migrations: [path.join(__dirname, '/migrations/*{.ts,.js}')],
  synchronize: false,
});
