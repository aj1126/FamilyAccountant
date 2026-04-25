import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  localId!: string;

  @Column({ type: 'uuid', nullable: true })
  accountId: string | null;

  @Column({ type: 'uuid' })
  householdId!: string;

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
}
