import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionListComponent } from '../../transaction-list/transaction-list.component';
import { ClientService } from '../../services/client.service';
import { Transaction } from '../../models/client.models';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [CommonModule, TransactionListComponent, MatSnackBarModule],
  template: `
    <div class="transactions-page">
      <h2>{{ pageTitle }}</h2>
      <app-transaction-list
        [transactions]="transactions"
        [showFilters]="true"
        [showPagination]="true">
      </app-transaction-list>
    </div>
  `,
  styles: [`
    .transactions-page {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h2 {
      margin-bottom: 20px;
      color: #333;
    }
  `]
})
export class TransactionsPageComponent implements OnInit {
  transactions: Transaction[] = [];
  pageTitle = 'Mes Transactions';
  private accountId: number | null = null;

  constructor(
    private clientService: ClientService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    // Check for success message in navigation state
    const navigation = window.history.state;
    if (navigation?.success) {
      this.showSuccessNotification(navigation.success);
    }
  }

  ngOnInit() {
    // Subscribe to query params to get accountId
    this.route.queryParams.subscribe(params => {
      this.accountId = params['accountId'] ? Number(params['accountId']) : null;
      if (this.accountId) {
        this.pageTitle = 'Transactions du Compte';
        this.loadAccountTransactions(this.accountId);
      } else {
        this.pageTitle = 'Toutes les Transactions';
        this.loadAllTransactions();
      }
    });
  }

  private loadAccountTransactions(accountId: number) {
    this.clientService.getAccountTransactions(accountId).subscribe({
      next: (transactions) => {
        this.transactions = transactions;
      },
      error: (error) => {
        console.error(`Error loading transactions for account ${accountId}:`, error);
        this.showErrorNotification('Erreur lors du chargement des transactions');
      }
    });
  }

  private loadAllTransactions() {
    this.clientService.getCurrentUserAccounts().subscribe({
      next: (accounts) => {
        if (accounts && accounts.length > 0) {
          const transactionPromises = accounts.map(account =>
            this.clientService.getAccountTransactions(account.id).toPromise()
          );

          Promise.all(transactionPromises)
            .then(transactionArrays => {
              this.transactions = transactionArrays
                .filter(t => t !== undefined)
                .flat();
            })
            .catch(error => {
              console.error('Error loading all transactions:', error);
              this.showErrorNotification('Erreur lors du chargement des transactions');
            });
        }
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.showErrorNotification('Erreur lors du chargement des comptes');
      }
    });
  }

  private showSuccessNotification(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorNotification(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
} 