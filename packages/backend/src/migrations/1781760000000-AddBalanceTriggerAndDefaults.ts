import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBalanceTriggerAndDefaults1781760000000 implements MigrationInterface {
    name = 'AddBalanceTriggerAndDefaults1781760000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "currency" character varying NOT NULL DEFAULT 'USD'`);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" character varying NOT NULL DEFAULT 'member'`);

        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION "update_account_balance"()
            RETURNS TRIGGER
            AS $$
            BEGIN
                IF TG_OP = 'INSERT' THEN
                    IF NEW."accountId" IS NOT NULL AND NEW."deletedAt" IS NULL THEN
                        UPDATE "accounts"
                        SET "balance" = "balance" + NEW."amount"
                        WHERE "id" = NEW."accountId";
                    END IF;
                    RETURN NEW;
                ELSIF TG_OP = 'UPDATE' THEN
                    IF OLD."accountId" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
                        UPDATE "accounts"
                        SET "balance" = "balance" - OLD."amount"
                        WHERE "id" = OLD."accountId";
                    END IF;

                    IF NEW."accountId" IS NOT NULL AND NEW."deletedAt" IS NULL THEN
                        UPDATE "accounts"
                        SET "balance" = "balance" + NEW."amount"
                        WHERE "id" = NEW."accountId";
                    END IF;
                    RETURN NEW;
                ELSIF TG_OP = 'DELETE' THEN
                    IF OLD."accountId" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
                        UPDATE "accounts"
                        SET "balance" = "balance" - OLD."amount"
                        WHERE "id" = OLD."accountId";
                    END IF;
                    RETURN OLD;
                END IF;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS "trg_update_account_balance" ON "transactions"
        `);

        await queryRunner.query(`
            CREATE TRIGGER "trg_update_account_balance"
            AFTER INSERT OR UPDATE OR DELETE ON "transactions"
            FOR EACH ROW EXECUTE FUNCTION "update_account_balance"()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_update_account_balance" ON "transactions"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS "update_account_balance"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role"`);
        await queryRunner.query(`ALTER TABLE "households" DROP COLUMN IF EXISTS "currency"`);
    }
}
