import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('debts')
export class DebtEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  householdId!: string;

  @Column({ type: 'uuid' })
  creditorId!: string;

  @Column({ type: 'uuid' })
  debtorId!: string;

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

  @Column()
  direction!: string;

  @Column({ default: false })
  settled!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
