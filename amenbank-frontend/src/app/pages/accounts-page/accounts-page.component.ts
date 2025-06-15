import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountCardComponent } from '../../account-card/account-card.component';
import { ClientService } from '../../services/client.service';
import { BankAccount } from '../../models/client.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [CommonModule, AccountCardComponent],
  template: `
    <div class="accounts-page">
      <div class="accounts-header">
        <h2>Mes Comptes</h2>
        <button class="btn-refresh" (click)="loadAccounts()" [disabled]="loading">
          <span *ngIf="loading">⏳</span>
          <span *ngIf="!loading">🔄</span>
          Actualiser
        </button>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Chargement des comptes...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="errorMessage && !loading">
        <div class="error-content">
          <span class="error-icon">❌</span>
          <p>{{ errorMessage }}</p>
          <button class="btn-retry" (click)="loadAccounts()">Réessayer</button>
        </div>
      </div>

      <!-- Accounts Grid -->
      <div class="accounts-grid" *ngIf="!loading && !errorMessage && accounts.length > 0">
        <app-account-card 
          *ngFor="let account of accounts; trackBy: trackByAccountId"
          [account]="account"
          (accountSelected)="onAccountSelected($event)">
        </app-account-card>
      </div>

      <!-- No Accounts State -->
      <div class="no-data-state" *ngIf="!loading && !errorMessage && accounts.length === 0">
        <div class="no-data-content">
          <span class="no-data-icon">📄</span>
          <h4>Aucun compte trouvé</h4>
          <p>Vous n'avez pas encore de comptes bancaires.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .accounts-page {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .accounts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    h2 {
      margin: 0;
      color: #333;
    }

    .btn-refresh {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-refresh:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .accounts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-state, .no-data-state {
      text-align: center;
      padding: 40px;
    }

    .error-content, .no-data-content {
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      padding: 30px;
      max-width: 500px;
      margin: 0 auto;
    }

    .no-data-content {
      background-color: #f8f9fa;
      border-color: #e9ecef;
    }

    .error-icon, .no-data-icon {
      font-size: 24px;
      margin-bottom: 10px;
    }

    .btn-retry {
      background-color: #dc3545;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 15px;
    }
  `]
})
export class AccountsPageComponent implements OnInit {
  accounts: BankAccount[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private clientService: ClientService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAccounts();
  }

  loadAccounts() {
    this.loading = true;
    this.errorMessage = '';

    this.clientService.getCurrentUserAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.errorMessage = 'Une erreur est survenue lors du chargement des comptes.';
        this.loading = false;
      }
    });
  }

  trackByAccountId(index: number, account: BankAccount): number {
    return account.id;
  }

  onAccountSelected(account: BankAccount) {
    // Navigate to transactions page with account ID
    this.router.navigate(['/client/transactions'], { queryParams: { accountId: account.id } });
  }
} 