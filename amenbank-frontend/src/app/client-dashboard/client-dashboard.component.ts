// src/app/components/client-dashboard/client-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientService } from '../services/client.service';
import { AuthService } from '../services/auth.service';
import { BankAccount, Transaction, AccountType, TransactionType } from '../models/client.models';
import { AccountCardComponent } from '../account-card/account-card.component';
import { TransactionListComponent } from '../transaction-list/transaction-list.component';
import { CreateTransactionComponent } from '../create-transaction/create-transaction.component';
import { TransferNotificationListComponent } from '../components/notifications/transfer-notification-list.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AccountCardComponent, 
    TransactionListComponent,
    CreateTransactionComponent,
    TransferNotificationListComponent,
    MatSnackBarModule
  ],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <div class="header-left">
            <h1 class="header-title">Mon Espace Client</h1>
          </div>
          <div class="header-right">
            <app-transfer-notification-list></app-transfer-notification-list>
            <button class="btn btn-secondary refresh-btn" (click)="loadDashboard()" [disabled]="loading">
              <span *ngIf="loading" class="loading-icon">⏳</span>
              <span *ngIf="!loading" class="refresh-icon">🔄</span>
              Actualiser
            </button>
          </div>
        </div>
      </header>

      <main class="main-content">
        <!-- Loading State -->
        <div class="loading-state" *ngIf="loading">
          <div class="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" *ngIf="errorMessage && !loading">
          <div class="error-content">
            <h3>❌ Erreur</h3>
            <p>{{ errorMessage }}</p>
            <button class="btn btn-primary" (click)="loadDashboard()">Réessayer</button>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div class="dashboard-content" *ngIf="!loading && !errorMessage">
          <!-- Account Summary -->
          <section class="accounts-section">
            <div class="section-header">
              <h2>Mes Comptes ({{ accounts.length }})</h2>
            </div>

            <div class="accounts-grid" *ngIf="accounts && accounts.length > 0; else noAccounts">
              <app-account-card 
                *ngFor="let account of accounts; trackBy: trackByAccountId" 
                [account]="account"
                (accountSelected)="selectAccount($event)">
              </app-account-card>
            </div>
            
            <ng-template #noAccounts>
              <div class="empty-state">
                <h3>📄 Aucun compte trouvé</h3>
                <p>Vous n'avez pas encore de comptes bancaires.</p>
              </div>
            </ng-template>
          </section>

          <!-- Quick Actions -->
          <section class="quick-actions" *ngIf="!loading && accounts && accounts.length > 0">
            <button class="btn btn-primary" (click)="showCreateTransaction = true">
              💳 Nouvelle Transaction
            </button>
            <button class="btn btn-primary" (click)="navigateToScheduledTransfers()">
              🔄 Virements Permanents
            </button>
            <button class="btn btn-primary" (click)="showBulkImport = true">
              📄 Import CSV
            </button>
          </section>

          <!-- Selected Account Info -->
          <section class="selected-account" *ngIf="selectedAccount && !loading">
            <div class="card">
              <h3>Compte sélectionné: {{ selectedAccount.userFullName }}</h3>
              <p class="account-number">N° {{ selectedAccount.accountNumber }}</p>
              <p class="account-balance">Solde: {{ formatCurrency(selectedAccount.balance) }}</p>
            </div>
          </section>

          <!-- Recent Transactions -->
          <section class="transactions-section" *ngIf="selectedAccount && !loading">
            <div class="section-header">
              <h2>Transactions Récentes</h2>
            </div>
            <app-transaction-list 
              [accountId]="selectedAccount.id"
              [transactions]="recentTransactions">
            </app-transaction-list>
          </section>
        </div>
      </main>

      <!-- Modals -->
      <div class="modal" *ngIf="showCreateTransaction" (click)="closeModal($event)">
        <div class="modal-content">
          <button class="modal-close" (click)="showCreateTransaction = false">&times;</button>
          <app-create-transaction 
            [accounts]="accounts"
            (transactionCreated)="onTransactionCreated($event)">
          </app-create-transaction>
        </div>
      </div>

      <div class="modal" *ngIf="showBulkImport" (click)="closeModal($event)">
        <div class="modal-content">
          <button class="modal-close" (click)="showBulkImport = false">&times;</button>
          <h3>Importer des transactions</h3>
          <div class="form-group">
            <input type="file" accept=".csv" class="form-control" (change)="onFileSelect($event)">
          </div>
          <button 
            class="btn btn-primary" 
            [disabled]="!selectedFile" 
            (click)="importTransactions()">
            Importer
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Container */
    .app-container {
      min-height: 100vh;
      background-color: var(--background);
      color: var(--text-primary);
      transition: var(--theme-transition);
    }

    /* Header */
    .header {
      background-color: var(--surface);
      box-shadow: var(--shadow);
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid var(--border);
      transition: var(--theme-transition);
    }

    .header-content {
      max-width: 1440px;
      margin: 0 auto;
      padding: var(--spacing-4, 16px) var(--spacing-6, 24px);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-title {
      font-size: var(--font-size-2xl, 24px);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      transition: var(--theme-transition);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-4, 16px);
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: var(--spacing-2, 8px);
      transition: var(--theme-transition);
    }

    /* Main Content */
    .main-content {
      max-width: 1440px;
      margin: 0 auto;
      padding: var(--spacing-6, 24px);
    }

    .dashboard-content {
      display: grid;
      gap: var(--spacing-6, 24px);
    }

    /* Section Styling */
    .section-header {
      margin-bottom: var(--spacing-4, 16px);
    }

    .section-header h2 {
      color: var(--text-primary);
      font-size: var(--font-size-xl, 20px);
      font-weight: 600;
      margin: 0;
      transition: var(--theme-transition);
    }

    .accounts-grid {
      display: grid;
      gap: var(--spacing-4, 16px);
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    /* Quick Actions */
    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-3, 12px);
    }

    /* Selected Account */
    .selected-account .card {
      background: var(--primary);
      color: white;
      border: 1px solid var(--primary);
    }

    .account-number {
      font-size: var(--font-size-sm, 14px);
      opacity: 0.9;
      margin-bottom: var(--spacing-2, 8px);
    }

    .account-balance {
      font-size: var(--font-size-xl, 20px);
      font-weight: 600;
    }

    /* Card Component */
    .card {
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-4, 16px);
      box-shadow: var(--shadow);
      transition: var(--theme-transition);
    }

    /* Button Styles */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2, 8px) var(--spacing-4, 16px);
      border-radius: var(--radius-md, 6px);
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: var(--theme-transition);
      border: 1px solid transparent;
      font-size: var(--font-size-sm, 14px);

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background-color: var(--surface-disabled);
        color: var(--text-disabled);
      }

      &:focus {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
    }

    .btn-primary {
      background-color: var(--primary);
      color: white;
      border-color: var(--primary);

      &:hover:not(:disabled) {
        background-color: var(--primary-hover);
        border-color: var(--primary-hover);
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
      }
    }

    .btn-secondary {
      background-color: var(--surface);
      color: var(--text-primary);
      border-color: var(--border);

      &:hover:not(:disabled) {
        background-color: var(--surface-hover);
        border-color: var(--border-hover);
      }
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-12, 48px);
      color: var(--text-secondary);
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: var(--spacing-4, 16px);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Error State */
    .error-state {
      padding: var(--spacing-8, 32px);
      text-align: center;
    }

    .error-content {
      max-width: 400px;
      margin: 0 auto;
      padding: var(--spacing-6, 24px);
      background-color: var(--error-light);
      border: 1px solid var(--error-border);
      border-radius: var(--radius-lg, 8px);
      color: var(--error-text);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--spacing-8, 32px);
      background-color: var(--surface-variant);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 8px);
      color: var(--text-secondary);
    }

    /* Modal */
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal-content {
      background-color: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 8px);
      padding: var(--spacing-6, 24px);
      width: 90%;
      max-width: 500px;
      position: relative;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);
      color: var(--text-primary);
    }

    .modal-close {
      position: absolute;
      top: var(--spacing-4, 16px);
      right: var(--spacing-4, 16px);
      background: none;
      border: none;
      font-size: var(--font-size-xl, 20px);
      color: var(--text-secondary);
      cursor: pointer;
      padding: var(--spacing-2, 8px);
      line-height: 1;
      border-radius: var(--radius-full, 50%);
      transition: var(--theme-transition);
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background-color: var(--surface-hover);
        color: var(--text-primary);
      }

      &:focus {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
    }

    /* Form Elements */
    .form-group {
      margin-bottom: var(--spacing-4, 16px);
    }

    .form-control {
      width: 100%;
      padding: var(--spacing-3, 12px);
      border: 1px solid var(--border);
      border-radius: var(--radius-md, 6px);
      background-color: var(--surface);
      color: var(--text-primary);
      font-size: var(--font-size-sm, 14px);
      transition: var(--theme-transition);

      &:focus {
        outline: none;
        border-color: var(--border-focus);
        box-shadow: 0 0 0 2px var(--primary-alpha);
      }

      &::placeholder {
        color: var(--text-secondary);
      }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-content {
        padding: var(--spacing-4, 16px);
        flex-direction: column;
        gap: var(--spacing-4, 16px);
        text-align: center;
      }

      .header-right {
        width: 100%;
        justify-content: center;
      }

      .quick-actions {
        flex-direction: column;
      }

      .accounts-grid {
        grid-template-columns: 1fr;
      }

      .modal-content {
        width: 95%;
        margin: var(--spacing-4, 16px);
      }
    }

    /* Accessibility */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      .btn:hover {
        transform: none;
      }
    }

    @media (prefers-contrast: high) {
      .btn {
        border-width: 2px;
      }
      
      .card {
        border-width: 2px;
      }
    }
  `]
})
export class ClientDashboardComponent implements OnInit {
  accounts: BankAccount[] = [];
  selectedAccount: BankAccount | null = null;
  recentTransactions: Transaction[] = [];
  
  loading = false;
  errorMessage = '';
  showCreateTransaction = false;
  showBulkImport = false;
  selectedFile: File | null = null;
  showDebugInfo = false;

  constructor(
    private clientService: ClientService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    console.log('🚀 ClientDashboardComponent ngOnInit started');
    
    if (!this.authService.isAuthenticated()) {
      console.log('❌ User not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
      return;
    }
    
    console.log('✅ User authenticated, loading dashboard');
    this.loadDashboard();
  }

  loadDashboard() {
    console.log('🔄 LoadDashboard started');
    this.loading = true;
    this.errorMessage = '';
    
    this.clientService.getCurrentUserAccounts().subscribe({
      next: (accounts) => {
        console.log('✅ Accounts received:', accounts);
        
        // Ensure accounts is always an array and handle null/undefined
        if (Array.isArray(accounts)) {
          this.accounts = accounts.filter(account => account != null);
        } else if (accounts) {
          this.accounts = [accounts];
        } else {
          this.accounts = [];
        }
        
        console.log('✅ Processed accounts:', this.accounts);
        
        // Auto-select first account if available
        if (this.accounts.length > 0) {
          this.selectAccount(this.accounts[0]);
        } else {
          console.log('ℹ️ No accounts found');
        }
        
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading accounts:', error);
        
        if (error.status === 401) {
          this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        } else if (error.status === 403) {
          this.errorMessage = 'Accès non autorisé.';
        } else {
          this.errorMessage = error.error?.message || 'Erreur lors du chargement des comptes';
        }
        
        this.loading = false;
        this.accounts = [];
      }
    });
  }

  selectAccount(account: BankAccount) {
    if (!account) {
      console.warn('⚠️ Trying to select null/undefined account');
      return;
    }
    
    console.log('🔄 Selecting account:', account);
    this.selectedAccount = account;
    this.loadRecentTransactions(account.id);
  }

  loadRecentTransactions(accountId: number) {
    if (!accountId) {
      console.warn('⚠️ No account ID provided for loading transactions');
      this.recentTransactions = [];
      return;
    }
    
    console.log('🔄 Loading transactions for account:', accountId);
    
    this.clientService.getAccountTransactions(accountId).subscribe({
      next: (transactions) => {
        console.log('✅ Transactions loaded:', transactions);
        
        // Ensure transactions is always an array
        if (Array.isArray(transactions)) {
          this.recentTransactions = transactions.slice(0, 10); // Show only recent 10
        } else {
          this.recentTransactions = [];
        }
      },
      error: (error) => {
        console.error('❌ Error loading transactions:', error);
        this.recentTransactions = [];
      }
    });
  }

  onTransactionCreated(transaction: Transaction) {
    console.log('✅ Transaction created:', transaction);
    this.showCreateTransaction = false;
    // Refresh both accounts and transactions
    this.loadDashboard();
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showCreateTransaction = false;
      this.showBulkImport = false;
    }
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
    }
  }

  importTransactions() {
    if (this.selectedFile) {
      this.loading = true;
      this.errorMessage = '';
      
      this.clientService.importBulkTransactions(this.selectedFile).subscribe({
        next: (response) => {
          console.log('✅ Import successful:', response);
          this.loading = false;
          this.showBulkImport = false;
          this.selectedFile = null;
          
          // Show success notification using MatSnackBar
          this.snackBar.open(response.message || 'Les transactions ont été importées avec succès', 'Fermer', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          
          // Refresh the dashboard to show new transactions
          this.loadDashboard();
        },
        error: (error) => {
          console.error('❌ Import failed:', error);
          this.loading = false;
          this.errorMessage = error.message || 'Erreur lors de l\'import des transactions';
          
          // Show error notification
          this.snackBar.open(this.errorMessage, 'Fermer', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
          
          // Refresh dashboard even on error to ensure consistent state
            this.loadDashboard();
        }
      });
    }
  }

  trackByAccountId(index: number, account: BankAccount): number {
    return account?.id || index;
  }

  formatCurrency(amount: number): string {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 2
    }).format(safeAmount);
  }

  navigateToScheduledTransfers() {
    this.router.navigate(['/client/scheduled-transfers']);
  }
}