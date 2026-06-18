import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { AccountEntity } from './account.entity';
import { HouseholdEntity } from './household.entity';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  localId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  accountId: string | null = null;

  @Index()
  @Column({ type: 'uuid' })
  householdId!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => Number(value),
    },
  })
  amount!: number;

  @Column({ default: 'USD' })
  currency!: string;

  @Column()
  description!: string;

  @Column({ default: '' })
  category!: string;

  @Index()
  @Column({ type: 'date' })
  transactionDate!: string;

  @Column({ default: 'synced' })
  syncStatus!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;

  @ManyToOne(() => UserEntity, (u) => u.transactions)
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @ManyToOne(() => AccountEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'accountId' })
  account?: AccountEntity | null;

  @ManyToOne(() => HouseholdEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'householdId' })
  household?: HouseholdEntity;
}

