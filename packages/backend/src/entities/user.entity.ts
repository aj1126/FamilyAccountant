import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransactionEntity } from './transaction.entity';
import { HouseholdEntity } from './household.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  displayName!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  householdId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => TransactionEntity, (t) => t.user)
  transactions!: TransactionEntity[];

  @ManyToOne(() => HouseholdEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'householdId' })
  household?: HouseholdEntity | null;
}

