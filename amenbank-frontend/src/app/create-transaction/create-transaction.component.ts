// src/app/components/create-transaction/create-transaction.component.ts

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientService } from '../services/client.service';
import { BankAccount, CreateTransactionRequest, Transaction, TransactionType } from '../models/client.models';
@Component({
  selector: 'app-create-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-transaction">
      <h3>Nouvelle Transaction</h3>
      <form (ngSubmit)="onSubmit()" #transactionForm="ngForm">
        
        <div class="form-group">
          <label for="sourceAccount">Compte source *</label>
          <select 
            id="sourceAccount" 
            [(ngModel)]="selectedAccountId" 
            name="sourceAccount" 
            required
            class="form-control">
            <option value="">Sélectionnez un compte</option>
            <option *ngFor="let account of accounts" [value]="account.id">
              {{ account.accountNumber }} - {{ formatCurrency(account.balance) }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="transactionType">Type de transaction *</label>
          <select 
            id="transactionType" 
            [(ngModel)]="transactionRequest.type" 
            name="transactionType" 
            required
            (change)="onTypeChange()"
            class="form-control">
            <option value="">Sélectionnez un type</option>
            <option value="DEPOSIT">Dépôt</option>
            <option value="WITHDRAWAL">Retrait</option>
            <option value="TRANSFER">Virement</option>
          </select>
        </div>

        <div class="form-group">
          <label for="amount">Montant *</label>
          <input 
            type="number" 
            id="amount"
            [(ngModel)]="transactionRequest.amount" 
            name="amount" 
            step="0.01" 
            min="0.01"
            required
            class="form-control"
            placeholder="0.00">
        </div>

        <div class="form-group" *ngIf="transactionRequest.type === 'TRANSFER'">
          <label for="targetAccount">Compte destinataire *</label>
          <select 
            id="targetAccount" 
            [(ngModel)]="transactionRequest.targetAccountId" 
            name="targetAccount" 
            [required]="transactionRequest.type === 'TRANSFER'"
            class="form-control">
            <option value="">Sélectionnez un compte destinataire</option>
            <option *ngFor="let account of getTargetAccounts()" [value]="account.id">
              {{ account.accountNumber }} - {{ account.userFullName }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description"
            [(ngModel)]="transactionRequest.description" 
            name="description" 
            rows="3"
            class="form-control"
            placeholder="Description de la transaction (optionnel)">
          </textarea>
        </div>

        <!-- Transaction Summary -->
        <div class="transaction-summary" *ngIf="isFormValid()">
          <h4>Résumé de la transaction</h4>
          <div class="summary-item">
            <span>Type:</span>
            <span>{{ getTransactionTypeLabel(transactionRequest.type) }}</span>
          </div>
          <div class="summary-item">
            <span>Montant:</span>
            <span [class]="getAmountClass()">{{ formatCurrency(transactionRequest.amount) }}</span>
          </div>
          <div class="summary-item" *ngIf="selectedAccount">
            <span>Solde actuel:</span>
            <span>{{ formatCurrency(selectedAccount.balance) }}</span>
          </div>
          <div class="summary-item" *ngIf="selectedAccount">
            <span>Nouveau solde:</span>
            <span [class]="getNewBalanceClass()">{{ formatCurrency(calculateNewBalance()) }}</span>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            class="btn-cancel" 
            (click)="onCancel()">
            Annuler
          </button>
          <button 
            type="submit" 
            class="btn-submit" 
            [disabled]="!transactionForm.valid || isSubmitting">
            <span *ngIf="isSubmitting">Traitement...</span>
            <span *ngIf="!isSubmitting">Créer la transaction</span>
          </button>
        </div>

        <!-- Error Message -->
        <div class="error-message" *ngIf="errorMessage">
          {{ errorMessage }}
        </div>

      </form>
    </div>
  `,
  styles: [`
    .create-transaction {
      max-width: 500px;
      margin: 0 auto;
    }

    .create-transaction h3 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .form-control:invalid {
      border-color: #dc3545;
    }

    textarea.form-control {
      resize: vertical;
      min-height: 80px;
    }

    .transaction-summary {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 1px solid #e9ecef;
    }

    .transaction-summary h4 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .summary-item:last-child {
      margin-bottom: 0;
      padding-top: 8px;
      border-top: 1px solid #dee2e6;
      font-weight: 600;
    }

    .amount-positive {
      color: #28a745;
      font-weight: 600;
    }

    .amount-negative {
      color: #dc3545;
      font-weight: 600;
    }

    .balance-positive {
      color: #28a745;
    }

    .balance-negative {
      color: #dc3545;
      font-weight: 600;
    }

    .form-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .btn-cancel {
      background-color: #6c757d;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-cancel:hover {
      background-color: #5a6268;
    }

    .btn-submit {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-submit:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .error-message {
      background-color: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 4px;
      margin-top: 15px;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class CreateTransactionComponent {
  @Input() accounts: BankAccount[] = [];
  @Output() transactionCreated = new EventEmitter<Transaction>();

  selectedAccountId: number | null = null;
  isSubmitting = false;
  errorMessage = '';

  transactionRequest: CreateTransactionRequest = {
    amount: 0,
    type: TransactionType.DEPOSIT,
    description: '',
    targetAccountId: undefined
  };

  constructor(private clientService: ClientService) {}

  get selectedAccount(): BankAccount | null {
    return this.accounts.find(acc => acc.id === this.selectedAccountId) || null;
  }

  onTypeChange() {
    if (this.transactionRequest.type !== TransactionType.TRANSFER) {
      this.transactionRequest.targetAccountId = undefined;
    }
  }

  getTargetAccounts(): BankAccount[] {
    return this.accounts.filter(acc => acc.id !== this.selectedAccountId);
  }

  isFormValid(): boolean {
    return !!(
      this.selectedAccountId &&
      this.transactionRequest.type &&
      this.transactionRequest.amount > 0 &&
      (this.transactionRequest.type !== TransactionType.TRANSFER || this.transactionRequest.targetAccountId)
    );
  }

  calculateNewBalance(): number {
    if (!this.selectedAccount || !this.transactionRequest.amount) {
      return 0;
    }

    let newBalance = this.selectedAccount.balance;
    
    switch (this.transactionRequest.type) {
      case TransactionType.DEPOSIT:
        newBalance += this.transactionRequest.amount;
        break;
      case TransactionType.WITHDRAWAL:
      case TransactionType.TRANSFER:
        newBalance -= this.transactionRequest.amount;
        break;
    }

    return newBalance;
  }

  getAmountClass(): string {
    if (this.transactionRequest.type === TransactionType.DEPOSIT) {
      return 'amount-positive';
    }
    return 'amount-negative';
  }

  getNewBalanceClass(): string {
    const newBalance = this.calculateNewBalance();
    return newBalance >= 0 ? 'balance-positive' : 'balance-negative';
  }

  getTransactionTypeLabel(type: TransactionType): string {
    switch (type) {
      case TransactionType.DEPOSIT:
        return 'Dépôt';
      case TransactionType.WITHDRAWAL:
        return 'Retrait';
      case TransactionType.TRANSFER:
        return 'Virement';
      default:
        return 'Inconnu';
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(amount);
  }

  onSubmit() {
    if (!this.isFormValid() || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.clientService.createTransaction(this.selectedAccountId!, this.transactionRequest).subscribe({
      next: (transaction) => {
        this.transactionCreated.emit(transaction);
        this.resetForm();
        this.isSubmitting = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Une erreur est survenue lors de la création de la transaction';
        this.isSubmitting = false;
      }
    });
  }

  onCancel() {
    this.resetForm();
  }

  private resetForm() {
    this.selectedAccountId = null;
    this.transactionRequest = {
      amount: 0,
      type: TransactionType.DEPOSIT,
      description: '',
      targetAccountId: undefined
    };
    this.errorMessage = '';
  }
}