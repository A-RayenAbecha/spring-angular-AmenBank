// src/app/models/client.model.ts

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
  FIXED_TERM = 'FIXED_TERM'
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER'
}

export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

export interface BankAccount {
  id: number;
  iban: string;
  accountNumber: string;
  balance: number;
  type: AccountType;
  active: boolean;
  userId: number;
  userFullName: string;
}

export interface Transaction {
  id: number;
  date: string;
  amount: number;
  balanceAfter: number;
  type: TransactionType;
  description: string;
  accountId: number;
  accountIban: string;
}

export interface CreateTransactionRequest {
  amount: number;
  type: TransactionType;
  description: string;
  targetAccountId?: number;
}

export interface TransactionFilterRequest {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  minAmount?: number;
  maxAmount?: number;
}

export interface ScheduledTransfer {
  id: number;
  amount: number;
  startDate: string;
  endDate: string;
  frequency: Frequency;
  description: string;
  active: boolean;
  sourceAccountId: number;
  targetAccountId: number;
}

export interface ScheduledTransferRequest {
  amount: number;
  startDate: string;
  endDate: string;
  frequency: Frequency;
  description: string;
  sourceAccountId: number;
  targetAccountId: number;
}