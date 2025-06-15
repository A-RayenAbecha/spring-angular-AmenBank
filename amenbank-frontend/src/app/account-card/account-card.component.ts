// src/app/components/account-card/account-card.component.ts

import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankAccount, AccountType } from '../models/client.models';

@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="account-card" 
         [class.inactive]="account && !account.active" 
         (click)="onAccountClick()"
         *ngIf="account">
      <div class="account-header">
        <div class="account-type">
          <span class="type-badge" [class]="getAccountTypeClass()">
            {{ getAccountTypeLabel() }}
          </span>
          <!-- ✅ FIXED: Safe navigation for active property -->
          <span class="status-badge" 
                [class.active]="account.active === true" 
                [class.inactive]="account.active === false">
            {{ account.active ? 'Actif' : 'Inactif' }}
          </span>
        </div>
      </div>
      
      <div class="account-details">
        <div class="account-number">
          <!-- ✅ FIXED: Safe navigation -->
          <strong>{{ account.accountNumber || 'N/A' }}</strong>
        </div>
        <div class="iban">
          IBAN: {{ formatIban(account.iban) }}
        </div>
      </div>
      
      <div class="balance-section">
        <!-- ✅ FIXED: Handle null/undefined balance -->
        <div class="balance" [class.negative]="(account.balance || 0) < 0">
          {{ formatCurrency(account.balance || 0) }}
        </div>
        <div class="balance-label">Solde disponible</div>
      </div>
      
      <div class="account-actions">
        <button class="btn-action" (click)="onViewTransactions($event)">
          Voir les transactions
        </button>
      </div>
    </div>

    <!-- ✅ FIXED: Show error state if account is null -->
    <div class="account-error" *ngIf="!account">
      <p>❌ Erreur de chargement du compte</p>
    </div>
  `,
  styles: [`
    .account-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      color: white;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      overflow: hidden;
      min-height: 200px;
    }

    .account-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }

    .account-card.inactive {
      opacity: 0.6;
      background: linear-gradient(135deg, #636363 0%, #a2a2a2 100%);
    }

    .account-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255,255,255,0.1);
      opacity: 0;
      transition: opacity 0.2s;
    }

    .account-card:hover::before {
      opacity: 1;
    }

    .account-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
    }

    .account-type {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .type-badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .type-badge.checking {
      background-color: #4CAF50;
    }

    .type-badge.savings {
      background-color: #2196F3;
    }

    .type-badge.fixed-term {
      background-color: #FF9800;
    }

    .type-badge.unknown {
      background-color: #9E9E9E;
    }

    .status-badge {
      padding: 2px 6px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 500;
    }

    .status-badge.active {
      background-color: rgba(76, 175, 80, 0.3);
      color: #4CAF50;
    }

    .status-badge.inactive {
      background-color: rgba(158, 158, 158, 0.3);
      color: #9E9E9E;
    }

    .account-details {
      margin-bottom: 20px;
    }

    .account-number {
      font-size: 18px;
      margin-bottom: 5px;
    }

    .iban {
      font-size: 14px;
      opacity: 0.9;
      font-family: monospace;
    }

    .balance-section {
      margin-bottom: 20px;
    }

    .balance {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 5px;
    }

    .balance.negative {
      color: #ffcdd2;
    }

    .balance-label {
      font-size: 12px;
      opacity: 0.8;
    }

    .account-actions {
      display: flex;
      justify-content: flex-end;
    }

    .btn-action {
      background-color: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: background-color 0.2s;
    }

    .btn-action:hover {
      background-color: rgba(255,255,255,0.3);
    }

    /* ✅ FIXED: Error state styling */
    .account-error {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: #721c24;
    }

    .account-error p {
      margin: 0;
      font-weight: 500;
    }
  `]
})
export class AccountCardComponent implements OnInit {
  @Input() account!: BankAccount;
  @Output() accountSelected = new EventEmitter<BankAccount>();

  ngOnInit() {
    // ✅ FIXED: Add initialization check
    if (!this.account) {
      console.warn('⚠️ AccountCardComponent: account is null or undefined');
    } else {
      console.log('✅ AccountCardComponent initialized with account:', this.account);
    }
  }

  onAccountClick() {
    if (this.account) {
      this.accountSelected.emit(this.account);
    }
  }

  onViewTransactions(event: Event) {
    event.stopPropagation();
    if (this.account) {
      this.accountSelected.emit(this.account);
    }
  }

  getAccountTypeClass(): string {
    // ✅ FIXED: Add null check
    if (!this.account || !this.account.type) {
      return 'unknown';
    }

    switch (this.account.type) {
      case AccountType.CHECKING:
        return 'checking';
      case AccountType.SAVINGS:
        return 'savings';
      case AccountType.FIXED_TERM:
        return 'fixed-term';
      default:
        return 'unknown';
    }
  }

  getAccountTypeLabel(): string {
    // ✅ FIXED: Add null check
    if (!this.account || !this.account.type) {
      return 'Type Inconnu';
    }

    switch (this.account.type) {
      case AccountType.CHECKING:
        return 'Compte Courant';
      case AccountType.SAVINGS:
        return 'Compte Épargne';
      case AccountType.FIXED_TERM:
        return 'Compte à Terme';
      default:
        return 'Type Inconnu';
    }
  }

  formatIban(iban: string): string {
    // ✅ FIXED: Handle null/undefined IBAN
    if (!iban) return 'N/A';
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }

  formatCurrency(amount: number): string {
    // ✅ FIXED: Handle null/undefined amount
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(safeAmount);
  }
}