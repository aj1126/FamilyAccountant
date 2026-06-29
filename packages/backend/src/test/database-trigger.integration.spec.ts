import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TransactionEntity } from '../entities/transaction.entity';
import { AccountEntity } from '../entities/account.entity';
import { HouseholdEntity } from '../entities/household.entity';
import { UserEntity } from '../entities/user.entity';
import { DebtEntity } from '../entities/debt.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { CategoryEntity } from '../entities/category.entity';
import { BudgetEntity } from '../entities/budget.entity';
import { Repository } from 'typeorm';
import * as path from 'path';

const databaseUrl = process.env.DATABASE_URL;

// Safety Guard: Only run integration tests if database ends with _test to prevent accidental data loss on developer DBs
if (databaseUrl) {
  const dbName = databaseUrl.split('/').pop()?.split('?')[0];
  if (!dbName || !dbName.endsWith('_test')) {
    console.warn(`[SKIPPED] Database Trigger Integration Tests: Database "${dbName}" does not end with "_test".`);
    describe('Database Trigger Integration Tests (SKIPPED - Safe Mode)', () => {
      it('skips tests to prevent data loss on non-test database', () => {
        console.log(`Skipping integration tests. Please configure DATABASE_URL to point to a database ending with "_test" (e.g. "family_accountant_test") to enable.`);
      });
    });
  } else {
    runTests();
  }
} else {
  describe('Database Trigger Integration Tests (SKIPPED - DATABASE_URL not set)', () => {
    it('skips database-dependent integration tests', () => {
      console.log('Skipping database trigger integration tests because DATABASE_URL is not configured.');
    });
  });
}

function runTests() {
  describe('Database Trigger Integration Tests', () => {
    let module: TestingModule;
    let txRepo: Repository<TransactionEntity>;
    let accountRepo: Repository<AccountEntity>;
    let householdRepo: Repository<HouseholdEntity>;
    let userRepo: Repository<UserEntity>;

    let testHousehold: HouseholdEntity;
    let testUser: UserEntity;

    beforeAll(async () => {
      module = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'postgres',
            url: databaseUrl,
            entities: [
              UserEntity,
              HouseholdEntity,
              AccountEntity,
              TransactionEntity,
              DebtEntity,
              PaymentEntity,
              CategoryEntity,
              BudgetEntity,
            ],
            synchronize: false,
            dropSchema: true, // Drops existing schema/tables
            migrationsRun: true, // Runs migrations from scratch
            migrations: [path.join(__dirname, '../migrations/*{.ts,.js}')],
          }),
          TypeOrmModule.forFeature([
            UserEntity,
            HouseholdEntity,
            AccountEntity,
            TransactionEntity,
            DebtEntity,
            PaymentEntity,
            CategoryEntity,
            BudgetEntity,
          ]),
        ],
      }).compile();

      txRepo = module.get<Repository<TransactionEntity>>(getRepositoryToken(TransactionEntity));
      accountRepo = module.get<Repository<AccountEntity>>(getRepositoryToken(AccountEntity));
      householdRepo = module.get<Repository<HouseholdEntity>>(getRepositoryToken(HouseholdEntity));
      userRepo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));

      const triggers = await txRepo.query(`
        SELECT DISTINCT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'transactions'
          AND trigger_name = 'trg_update_account_balance'
      `);
      expect(triggers.length).toBe(1);
    });

    afterAll(async () => {
      if (module) {
        await module.close();
      }
    });

    beforeEach(async () => {
      await txRepo.query(`
        TRUNCATE TABLE
          transactions,
          accounts,
          users,
          households
        RESTART IDENTITY CASCADE
      `);

      // Create a test user first (to set as owner of household)
      const user = userRepo.create({
        id: '11111111-1111-1111-1111-111111111111',
        email: 'integration@test.com',
        passwordHash: 'hashed',
        displayName: 'Test User',
        role: 'admin',
      });
      testUser = await userRepo.save(user);

      // Create a household owned by this user
      const household = householdRepo.create({
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Integration Household',
        currency: 'USD',
        ownerId: testUser.id,
      });
      testHousehold = await householdRepo.save(household);

      // Link user to household
      testUser.householdId = testHousehold.id;
      await userRepo.save(testUser);
    });

    it('should adjust account balance automatically on transaction INSERT', async () => {
      // Create account
      const account = await accountRepo.save(
        accountRepo.create({
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Checking Account',
          type: 'checking',
          balance: 1000.0,
          currency: 'USD',
          householdId: testHousehold.id,
        }),
      );

      // Insert transaction of amount 250
      await txRepo.save(
        txRepo.create({
          localId: '44444444-4444-4444-4444-444444444444',
          accountId: account.id,
          householdId: testHousehold.id,
          userId: testUser.id,
          amount: 250.0,
          currency: 'USD',
          description: 'Groceries',
          category: 'Food',
          transactionDate: '2026-06-19',
          syncStatus: 'synced',
        }),
      );

      // Verify trigger updated the account balance
      const updatedAccount = await accountRepo.findOneBy({ id: account.id });
      expect(updatedAccount).toBeDefined();
      expect(Number(updatedAccount!.balance)).toBe(1250.0);
    });

    it('should adjust account balance on transaction UPDATE (amount changed)', async () => {
      const account = await accountRepo.save(
        accountRepo.create({
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Checking Account',
          type: 'checking',
          balance: 1000.0,
          currency: 'USD',
          householdId: testHousehold.id,
        }),
      );

      const tx = await txRepo.save(
        txRepo.create({
          localId: '44444444-4444-4444-4444-444444444444',
          accountId: account.id,
          householdId: testHousehold.id,
          userId: testUser.id,
          amount: 250.0,
          currency: 'USD',
          description: 'Groceries',
          category: 'Food',
          transactionDate: '2026-06-19',
          syncStatus: 'synced',
        }),
      );

      // Update transaction amount from 250 to -100
      tx.amount = -100.0;
      await txRepo.save(tx);

      // The balance should be: 1000 + (-100) = 900
      const updatedAccount = await accountRepo.findOneBy({ id: account.id });
      expect(Number(updatedAccount!.balance)).toBe(900.0);
    });

    it('should adjust balances on transaction UPDATE (accountId changed)', async () => {
      const account1 = await accountRepo.save(
        accountRepo.create({
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Account 1',
          type: 'checking',
          balance: 1000.0,
          currency: 'USD',
          householdId: testHousehold.id,
        }),
      );

      const account2 = await accountRepo.save(
        accountRepo.create({
          id: '55555555-5555-5555-5555-555555555555',
          name: 'Account 2',
          type: 'savings',
          balance: 500.0,
          currency: 'USD',
          householdId: testHousehold.id,
        }),
      );

      const tx = await txRepo.save(
        txRepo.create({
          localId: '44444444-4444-4444-4444-444444444444',
          accountId: account1.id,
          householdId: testHousehold.id,
          userId: testUser.id,
          amount: 200.0,
          currency: 'USD',
          description: 'Transfer',
          category: 'Transfer',
          transactionDate: '2026-06-19',
          syncStatus: 'synced',
        }),
      );

      // Balance of Account 1 should be 1200
      let updatedAcc1 = await accountRepo.findOneBy({ id: account1.id });
      expect(Number(updatedAcc1!.balance)).toBe(1200.0);

      // Reassign transaction to Account 2
      tx.accountId = account2.id;
      await txRepo.save(tx);

      // Balance of Account 1 should revert to 1000
      updatedAcc1 = await accountRepo.findOneBy({ id: account1.id });
      expect(Number(updatedAcc1!.balance)).toBe(1000.0);

      // Balance of Account 2 should increase by 200 to 700
      const updatedAcc2 = await accountRepo.findOneBy({ id: account2.id });
      expect(Number(updatedAcc2!.balance)).toBe(700.0);
    });

    it('should adjust account balance on soft DELETE and RESTORE', async () => {
      const account = await accountRepo.save(
        accountRepo.create({
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Checking Account',
          type: 'checking',
          balance: 1000.0,
          currency: 'USD',
          householdId: testHousehold.id,
        }),
      );

      const tx = await txRepo.save(
        txRepo.create({
          localId: '44444444-4444-4444-4444-444444444444',
          accountId: account.id,
          householdId: testHousehold.id,
          userId: testUser.id,
          amount: 150.0,
          currency: 'USD',
          description: 'Refundable Buy',
          category: 'Shopping',
          transactionDate: '2026-06-19',
          syncStatus: 'synced',
        }),
      );

      // Verify trigger adjusted balance to 1150
      let updatedAccount = await accountRepo.findOneBy({ id: account.id });
      expect(Number(updatedAccount!.balance)).toBe(1150.0);

      // Soft delete transaction
      tx.deletedAt = new Date();
      await txRepo.save(tx);

      // Balance should revert to 1000
      updatedAccount = await accountRepo.findOneBy({ id: account.id });
      expect(Number(updatedAccount!.balance)).toBe(1000.0);

      // Restore transaction
      tx.deletedAt = null;
      await txRepo.save(tx);

      // Balance should return to 1150
      updatedAccount = await accountRepo.findOneBy({ id: account.id });
      expect(Number(updatedAccount!.balance)).toBe(1150.0);
    });
  });
}
