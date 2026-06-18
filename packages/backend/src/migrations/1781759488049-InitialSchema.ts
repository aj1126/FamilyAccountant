import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781759488049 implements MigrationInterface {
    name = 'InitialSchema1781759488049'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "households" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2b1aef2640717132e9231aac756" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e9a37d7a2d69fc1a14ed5e8ef6" ON "households" ("ownerId") `);
        await queryRunner.query(`CREATE TABLE "accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" uuid NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "balance" numeric(15,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0b5e737c7af2e869f949015641" ON "accounts" ("householdId") `);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "localId" character varying NOT NULL, "accountId" uuid, "householdId" uuid NOT NULL, "userId" uuid NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "description" character varying NOT NULL, "category" character varying NOT NULL DEFAULT '', "transactionDate" date NOT NULL, "syncStatus" character varying NOT NULL DEFAULT 'synced', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_d4fe69d7e933dc7999702b8400f" UNIQUE ("localId"), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_26d8aec71ae9efbe468043cd2b" ON "transactions" ("accountId") `);
        await queryRunner.query(`CREATE INDEX "IDX_893fc6bd2c61208d972828335f" ON "transactions" ("householdId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6bb58f2b6e30cb51a6504599f4" ON "transactions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_65a91cee6272cc0da149807869" ON "transactions" ("transactionDate") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "displayName" character varying NOT NULL, "householdId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_079b6673b88101596abc9ef0fc" ON "users" ("householdId") `);
        await queryRunner.query(`CREATE TABLE "debts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "householdId" uuid NOT NULL, "creditorId" uuid NOT NULL, "debtorId" uuid NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "description" character varying NOT NULL, "direction" character varying NOT NULL, "settled" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4bd9f54aab9e59628a3a2657fa1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d2194d4d6621517a05dc05214f" ON "debts" ("householdId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a233f083caa767b8ac708d9fc4" ON "debts" ("creditorId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1e071a0015c29c45f4dfaafb77" ON "debts" ("debtorId") `);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "debtId" uuid NOT NULL, "householdId" uuid NOT NULL, "amount" numeric(15,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'USD', "paidAt" TIMESTAMP WITH TIME ZONE NOT NULL, "note" character varying NOT NULL DEFAULT '', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8093c80f16ff3c820440244330" ON "payments" ("debtId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8bd73dfebdbc5e237122d77702" ON "payments" ("householdId") `);
        await queryRunner.query(`ALTER TABLE "households" ADD CONSTRAINT "FK_e9a37d7a2d69fc1a14ed5e8ef67" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "accounts" ADD CONSTRAINT "FK_0b5e737c7af2e869f9490156412" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_893fc6bd2c61208d972828335f0" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_079b6673b88101596abc9ef0fce" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "debts" ADD CONSTRAINT "FK_d2194d4d6621517a05dc05214fb" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "debts" ADD CONSTRAINT "FK_a233f083caa767b8ac708d9fc4a" FOREIGN KEY ("creditorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "debts" ADD CONSTRAINT "FK_1e071a0015c29c45f4dfaafb778" FOREIGN KEY ("debtorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8093c80f16ff3c8204402443301" FOREIGN KEY ("debtId") REFERENCES "debts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_8bd73dfebdbc5e237122d777028" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8bd73dfebdbc5e237122d777028"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_8093c80f16ff3c8204402443301"`);
        await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_1e071a0015c29c45f4dfaafb778"`);
        await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_a233f083caa767b8ac708d9fc4a"`);
        await queryRunner.query(`ALTER TABLE "debts" DROP CONSTRAINT "FK_d2194d4d6621517a05dc05214fb"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_079b6673b88101596abc9ef0fce"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_893fc6bd2c61208d972828335f0"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_26d8aec71ae9efbe468043cd2b9"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_6bb58f2b6e30cb51a6504599f41"`);
        await queryRunner.query(`ALTER TABLE "accounts" DROP CONSTRAINT "FK_0b5e737c7af2e869f9490156412"`);
        await queryRunner.query(`ALTER TABLE "households" DROP CONSTRAINT "FK_e9a37d7a2d69fc1a14ed5e8ef67"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8bd73dfebdbc5e237122d77702"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8093c80f16ff3c820440244330"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1e071a0015c29c45f4dfaafb77"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a233f083caa767b8ac708d9fc4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2194d4d6621517a05dc05214f"`);
        await queryRunner.query(`DROP TABLE "debts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_079b6673b88101596abc9ef0fc"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65a91cee6272cc0da149807869"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bb58f2b6e30cb51a6504599f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_893fc6bd2c61208d972828335f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26d8aec71ae9efbe468043cd2b"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b5e737c7af2e869f949015641"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9a37d7a2d69fc1a14ed5e8ef6"`);
        await queryRunner.query(`DROP TABLE "households"`);
    }

}
