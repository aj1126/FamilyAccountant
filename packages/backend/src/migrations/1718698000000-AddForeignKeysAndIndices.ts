import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddForeignKeysAndIndices1718698000000 implements MigrationInterface {
  name = 'AddForeignKeysAndIndices1718698000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add indices
    await queryRunner.query(`CREATE INDEX "IDX_users_householdId" ON "users" ("householdId")`);
    await queryRunner.query(`CREATE INDEX "IDX_households_ownerId" ON "households" ("ownerId")`);
    await queryRunner.query(`CREATE INDEX "IDX_accounts_householdId" ON "accounts" ("householdId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_accountId" ON "transactions" ("accountId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_householdId" ON "transactions" ("householdId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_userId" ON "transactions" ("userId")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_transactionDate" ON "transactions" ("transactionDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_debts_householdId" ON "debts" ("householdId")`);
    await queryRunner.query(`CREATE INDEX "IDX_debts_creditorId" ON "debts" ("creditorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_debts_debtorId" ON "debts" ("debtorId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_debtId" ON "payments" ("debtId")`);
    await queryRunner.query(`CREATE INDEX "IDX_payments_householdId" ON "payments" ("householdId")`);

    // 2. Add foreign keys
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_household" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "households" ADD CONSTRAINT "FK_households_owner" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT`);
    await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_accounts_household" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_account" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL`);
    await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_household" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "debts" ADD CONSTRAINT "FK_debts_household" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "debts" ADD CONSTRAINT "FK_debts_creditor" FOREIGN KEY ("creditorId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "debts" ADD CONSTRAINT "FK_debts_debtor" FOREIGN KEY ("debtorId") REFERENCES "users"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_debt" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_household" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign keys
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_household"`);
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_debt"`);
    await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_debts_debtor"`);
    await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_debts_creditor"`);
    await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_debts_household"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_household"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_transactions_account"`);
    await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_accounts_household"`);
    await queryRunner.query(`ALTER TABLE "households" DROP CONSTRAINT "FK_households_owner"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_household"`);

    // Remove indices
    await queryRunner.query(`DROP INDEX "IDX_payments_householdId"`);
    await queryRunner.query(`DROP INDEX "IDX_payments_debtId"`);
    await queryRunner.query(`DROP INDEX "IDX_debts_debtorId"`);
    await queryRunner.query(`DROP INDEX "IDX_debts_creditorId"`);
    await queryRunner.query(`DROP INDEX "IDX_debts_householdId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_transactionDate"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_householdId"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_accountId"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_householdId"`);
    await queryRunner.query(`DROP INDEX "IDX_households_ownerId"`);
    await queryRunner.query(`DROP INDEX "IDX_users_householdId"`);
  }
}
