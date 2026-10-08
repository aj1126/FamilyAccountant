import { MigrationInterface, QueryRunner } from "typeorm";

// Brings the TypeORM migrations in line with the entities and supabase/migrations/20260618000000_family_accountant_schema.sql:
// 29e256d added CategoryEntity, BudgetEntity and TransactionEntity.categoryId but no migration, so a database built by
// migrations (app.module.ts migrationsRun, database-trigger.integration.spec.ts) had no "categories", "budgets" or
// "transactions"."categoryId". IF NOT EXISTS keeps it safe on a database already created from the Supabase SQL.
export class AddCategoriesAndBudgets1791495469867 implements MigrationInterface {
    name = 'AddCategoriesAndBudgets1791495469867'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "householdId" uuid, "parentId" uuid, "name" character varying NOT NULL, "color" character varying, "icon" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_categories_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_categories_householdId" ON "categories" ("householdId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_categories_parentId" ON "categories" ("parentId") `);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_householdId"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_householdId" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT IF EXISTS "FK_categories_parentId"`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_categories_parentId" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "budgets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "householdId" uuid NOT NULL, "categoryId" uuid NOT NULL, "amount" numeric(15,2) NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "unique_household_category_period" UNIQUE ("householdId", "categoryId", "startDate"), CONSTRAINT "PK_budgets_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_budgets_householdId" ON "budgets" ("householdId") `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_budgets_categoryId" ON "budgets" ("categoryId") `);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "FK_budgets_householdId"`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_householdId" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "budgets" DROP CONSTRAINT IF EXISTS "FK_budgets_categoryId"`);
        await queryRunner.query(`ALTER TABLE "budgets" ADD CONSTRAINT "FK_budgets_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "categoryId" uuid`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_transactions_categoryId" ON "transactions" ("categoryId") `);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_transactions_categoryId"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_transactions_categoryId" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "FK_transactions_categoryId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transactions_categoryId"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP COLUMN IF EXISTS "categoryId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    }
}
