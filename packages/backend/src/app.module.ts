import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HouseholdsModule } from './modules/households/households.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { DebtsModule } from './modules/debts/debts.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SyncModule } from './modules/sync/sync.module';
import { UserEntity } from './entities/user.entity';
import { HouseholdEntity } from './entities/household.entity';
import { AccountEntity } from './entities/account.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { DebtEntity } from './entities/debt.entity';
import { PaymentEntity } from './entities/payment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          UserEntity,
          HouseholdEntity,
          AccountEntity,
          TransactionEntity,
          DebtEntity,
          PaymentEntity,
        ],
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    HouseholdsModule,
    AccountsModule,
    TransactionsModule,
    DebtsModule,
    PaymentsModule,
    SyncModule,
  ],
})
export class AppModule {}
