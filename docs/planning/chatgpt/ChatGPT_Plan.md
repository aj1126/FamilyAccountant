# Home Finances App (Multi-User / Multi-Platform)
## 1. Overview
A cross-platform home finance management app designed for multiple users (families, roommates, small groups). The app tracks debts, credits, accounts, cards, and payments while syncing across Windows 11 and Android devices.
## 2. Platform Strategy & Architecture
* **Frontend:** React Native (Android) + React & Electron (Windows 11)
* **Backend:** Node.js (NestJS) with REST API
* **Database:** PostgreSQL (primary) + SQLite (local device cache)
* **Sync Strategy:** Full offline-first sync engine with local queue, last-write-wins, and additive transactions.
## 3. Data Model & Relationships
* **Users:** id, name, email, password_hash, role
* **Households:** id, name, UserHousehold (user_id, household_id, role)
* **Accounts:** id, household_id, name, balance, type
* **Transactions:** id, account_id, created_by, assigned_to, amount, type, category, date, local_id, sync_status
* **Debts:** id, debtor_id, creditor_id, amount, due_date
* **Payments:** id, debt_id, amount, date
## 4. Starter Implementation (TypeScript)
### Backend (NestJS & TypeORM)
``typescript
// src/modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
@Module({
  imports: [JwtModule.register({ secret: 'secretKey' })],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
// transaction.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;
  @Column('decimal')
  amount: number;
  @Column()
  type: string;
  @Column()
  category: string;
  @Column({ nullable: true })
  note: string;
  @Column()
  date: Date;
  @Column({ nullable: true })
  local_id: string;
  @Column({ default: 'pending' })
  sync_status: string;
  @ManyToOne(() => User, (user) => user.transactions)
  user: User;
}
Frontend State & Sync Logic (Zustand)
TypeScript
// stores/useTransactions.ts
import { create } from 'zustand';
export const useTransactions = create((set) => ({
  transactions: [],
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [...state.transactions, tx],
    })),
}));
// sync.service.ts
export async function syncTransactions(localTxs) {
  const pending = localTxs.filter((t) => t.sync_status === 'pending');
  for (const tx of pending) {
    try {
      await fetch('http://localhost:3000/transactions', {
        method: 'POST',
        body: JSON.stringify(tx),
        headers: { 'Content-Type': 'application/json' },
      });
      tx.sync_status = 'synced';
    } catch (e) {
      tx.sync_status = 'pending';
    }
  }
}
