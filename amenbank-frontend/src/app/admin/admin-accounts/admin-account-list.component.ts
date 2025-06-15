import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminBankAccountService } from '../../services/admin-bank-account.service';
import { BankAccount } from '../../models/client.models';
import { AdminAccountFormComponent } from './admin-account-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-account-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <mat-card class="accounts-card">
        <mat-card-header>
          <mat-card-title>Gestion des Comptes Bancaires</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Filter Form -->
          <form [formGroup]="filterForm" class="filter-form">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>IBAN</mat-label>
                <input matInput formControlName="iban">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Numéro de compte</mat-label>
                <input matInput formControlName="accountNumber">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Type de compte</mat-label>
                <mat-select formControlName="type">
                  <mat-option [value]="">Tous</mat-option>
                  <mat-option *ngFor="let type of accountTypes" [value]="type">
                    {{ getAccountTypeLabel(type) }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
              
              <div class="filter-actions">
                <button mat-raised-button color="primary" (click)="applyFilters()">
                  <mat-icon>search</mat-icon> Rechercher
                </button>
                <button mat-raised-button (click)="resetFilters()">
                  <mat-icon>clear</mat-icon> Réinitialiser
                </button>
              </div>
            </div>
          </form>
          
          <div class="actions-bar">
            <button mat-raised-button color="primary" (click)="openAccountForm()">
              <mat-icon>add</mat-icon> Nouveau compte
            </button>
          </div>
          
          <!-- Loading Spinner -->
          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <!-- Accounts Table -->
          <div class="table-container" *ngIf="!loading">
            <table mat-table [dataSource]="accounts" matSort (matSortChange)="sortData($event)" class="mat-elevation-z8">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                <td mat-cell *matCellDef="let account">{{ account.id }}</td>
              </ng-container>
              
              <ng-container matColumnDef="accountNumber">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Numéro de compte</th>
                <td mat-cell *matCellDef="let account">{{ account.accountNumber }}</td>
              </ng-container>
              
              <ng-container matColumnDef="iban">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>IBAN</th>
                <td mat-cell *matCellDef="let account">{{ account.iban }}</td>
              </ng-container>
              
              <ng-container matColumnDef="balance">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Solde</th>
                <td mat-cell *matCellDef="let account">{{ account.balance | currency:'EUR' }}</td>
              </ng-container>
              
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
                <td mat-cell *matCellDef="let account">
                  {{ getAccountTypeLabel(account.type) }}
                </td>
              </ng-container>
              
              <ng-container matColumnDef="userFullName">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Propriétaire</th>
                <td mat-cell *matCellDef="let account">{{ account.userFullName }}</td>
              </ng-container>
              
              <ng-container matColumnDef="active">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
                <td mat-cell *matCellDef="let account">
                  <mat-chip [ngClass]="account.active ? 'status-active' : 'status-inactive'">
                    {{ account.active ? 'Actif' : 'Inactif' }}
                  </mat-chip>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let account">
                  <button mat-icon-button color="primary" (click)="editAccount(account)" matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="confirmDelete(account)" matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <!-- Empty state -->
            <div class="empty-state" *ngIf="accounts.length === 0">
              <mat-icon>account_balance</mat-icon>
              <p>Aucun compte bancaire trouvé</p>
            </div>
            
            <mat-paginator
              [length]="totalItems"
              [pageSize]="pageSize"
              [pageSizeOptions]="[5, 10, 25, 100]"
              (page)="onPageChange($event)">
            </mat-paginator>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .accounts-card {
      margin-bottom: 20px;
    }
    
    .filter-form {
      margin-bottom: 20px;
    }
    
    .filter-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      align-items: center;
    }
    
    .filter-actions {
      display: flex;
      gap: 8px;
    }
    
    mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    
    .actions-bar {
      margin-bottom: 16px;
      display: flex;
      justify-content: flex-end;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    table {
      width: 100%;
    }
    
    .status-active {
      background-color: #C8E6C9;
      color: #2E7D32;
    }
    
    .status-inactive {
      background-color: #FFCDD2;
      color: #C62828;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 24px;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #9e9e9e;
    }
    
    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
    }
  `]
})
export class AdminAccountListComponent implements OnInit {
  accounts: BankAccount[] = [];
  accountTypes: string[] = [];
  displayedColumns: string[] = ['id', 'accountNumber', 'iban', 'balance', 'type', 'userFullName', 'active', 'actions'];
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  sortBy = 'id';
  sortDir = 'asc';
  
  loading = true;
  filterForm: FormGroup;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<BankAccount>;
  
  constructor(
    private accountService: AdminBankAccountService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      iban: [''],
      accountNumber: [''],
      type: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadAccountTypes();
    this.loadAccounts();
  }
  
  loadAccountTypes(): void {
    this.accountService.getAccountTypes().subscribe({
      next: (types) => {
        this.accountTypes = types;
      },
      error: (error) => {
        console.error('Error loading account types', error);
        this.showErrorMessage('Erreur lors du chargement des types de compte');
      }
    });
  }
  
  loadAccounts(): void {
    this.loading = true;
    
    const filters = {
      iban: this.filterForm.value.iban || undefined,
      accountNumber: this.filterForm.value.accountNumber || undefined,
      type: this.filterForm.value.type || undefined
    };
    
    this.accountService.getAllAccounts(
      this.currentPage, 
      this.pageSize, 
      this.sortBy, 
      this.sortDir, 
      filters
    ).subscribe({
      next: (data) => {
        this.accounts = data.accounts;
        this.totalItems = data.totalItems;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts', error);
        this.showErrorMessage('Erreur lors du chargement des comptes');
        this.loading = false;
      }
    });
  }
  
  applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadAccounts();
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      iban: '',
      accountNumber: '',
      type: ''
    });
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadAccounts();
  }
  
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAccounts();
  }
  
  sortData(sort: Sort): void {
    this.sortBy = sort.active;
    this.sortDir = sort.direction || 'asc';
    this.loadAccounts();
  }
  
  openAccountForm(account?: BankAccount): void {
    const dialogRef = this.dialog.open(AdminAccountFormComponent, {
      width: '600px',
      data: { account: account }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAccounts();
      }
    });
  }
  
  editAccount(account: BankAccount): void {
    this.openAccountForm(account);
  }
  
  confirmDelete(account: BankAccount): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Êtes-vous sûr de vouloir supprimer le compte ${account.accountNumber} ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteAccount(account.id);
      }
    });
  }
  
  deleteAccount(id: number): void {
    this.accountService.deleteAccount(id).subscribe({
      next: () => {
        this.showSuccessMessage('Compte supprimé avec succès');
        this.loadAccounts();
      },
      error: (error) => {
        console.error('Error deleting account', error);
        this.showErrorMessage('Erreur lors de la suppression du compte');
      }
    });
  }
  
  getAccountTypeLabel(type: string): string {
    switch (type) {
      case 'CHECKING':
        return 'Compte courant';
      case 'SAVINGS':
        return 'Compte épargne';
      case 'CREDIT':
        return 'Compte de crédit';
      case 'BUSINESS':
        return 'Compte professionnel';
      default:
        return type;
    }
  }
  
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
  
  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
} 