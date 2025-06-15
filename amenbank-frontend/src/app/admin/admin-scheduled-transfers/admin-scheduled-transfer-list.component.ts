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

import { AdminScheduledTransferService, AdminScheduledTransfer } from '../../services/admin-scheduled-transfer.service';
import { AdminScheduledTransferFormComponent } from './admin-scheduled-transfer-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-scheduled-transfer-list',
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
      <mat-card class="transfers-card">
        <mat-card-header>
          <mat-card-title>Gestion des Virements Permanents</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Filter Form -->
          <form [formGroup]="filterForm" class="filter-form">
            <div class="filter-row">
              <mat-form-field appearance="outline">
                <mat-label>Compte source</mat-label>
                <input matInput formControlName="sourceAccount">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Compte destination</mat-label>
                <input matInput formControlName="destinationAccount">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select formControlName="status">
                  <mat-option [value]="">Tous</mat-option>
                  <mat-option value="ACTIVE">Actif</mat-option>
                  <mat-option value="INACTIVE">Inactif</mat-option>
                  <mat-option value="COMPLETED">Terminé</mat-option>
                  <mat-option value="CANCELLED">Annulé</mat-option>
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
            <button mat-raised-button color="primary" (click)="openTransferForm()">
              <mat-icon>add</mat-icon> Nouveau virement permanent
            </button>
          </div>
          
          <!-- Loading Spinner -->
          <div class="loading-container" *ngIf="loading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <!-- Transfers Table -->
          <div class="table-container" *ngIf="!loading">
            <table mat-table [dataSource]="transfers" matSort (matSortChange)="sortData($event)" class="mat-elevation-z8">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
                <td mat-cell *matCellDef="let transfer">{{ transfer.id }}</td>
              </ng-container>
              
              <ng-container matColumnDef="sourceAccount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Compte source</th>
                <td mat-cell *matCellDef="let transfer">{{ transfer.sourceAccount }}</td>
              </ng-container>
              
              <ng-container matColumnDef="destinationAccount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Compte destination</th>
                <td mat-cell *matCellDef="let transfer">{{ transfer.destinationAccount }}</td>
              </ng-container>
              
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Montant</th>
                <td mat-cell *matCellDef="let transfer">{{ transfer.amount | currency:'EUR' }}</td>
              </ng-container>
              
              <ng-container matColumnDef="frequency">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Fréquence</th>
                <td mat-cell *matCellDef="let transfer">
                  {{ getFrequencyLabel(transfer.frequency) }}
                </td>
              </ng-container>
              
              <ng-container matColumnDef="nextExecutionDate">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Prochaine exécution</th>
                <td mat-cell *matCellDef="let transfer">{{ transfer.nextExecutionDate | date:'dd/MM/yyyy' }}</td>
              </ng-container>
              
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
                <td mat-cell *matCellDef="let transfer">
                  <mat-chip [ngClass]="getStatusClass(transfer.status)">
                    {{ getStatusLabel(transfer.status) }}
                  </mat-chip>
                </td>
              </ng-container>
              
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let transfer">
                  <button mat-icon-button color="primary" (click)="editTransfer(transfer)" matTooltip="Modifier">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="confirmDelete(transfer)" matTooltip="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            
            <!-- Empty state -->
            <div class="empty-state" *ngIf="transfers.length === 0">
              <mat-icon>sync_alt</mat-icon>
              <p>Aucun virement permanent trouvé</p>
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
    
    .transfers-card {
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
    
    .status-completed {
      background-color: #B3E5FC;
      color: #0277BD;
    }
    
    .status-cancelled {
      background-color: #FFE0B2;
      color: #E65100;
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
export class AdminScheduledTransferListComponent implements OnInit {
  transfers: AdminScheduledTransfer[] = [];
  displayedColumns: string[] = ['id', 'sourceAccount', 'destinationAccount', 'amount', 'frequency', 'nextExecutionDate', 'status', 'actions'];
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 0;
  sortBy = 'id';
  sortDir = 'asc';
  
  loading = true;
  filterForm: FormGroup;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatTable) table!: MatTable<AdminScheduledTransfer>;
  
  constructor(
    private transferService: AdminScheduledTransferService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      sourceAccount: [''],
      destinationAccount: [''],
      status: ['']
    });
  }
  
  ngOnInit(): void {
    this.loadTransfers();
  }
  
  loadTransfers(): void {
    this.loading = true;
    
    const filters = {
      sourceAccount: this.filterForm.value.sourceAccount || undefined,
      destinationAccount: this.filterForm.value.destinationAccount || undefined,
      status: this.filterForm.value.status || undefined
    };
    
    // Clean up undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined || filters[key as keyof typeof filters] === '') {
        delete filters[key as keyof typeof filters];
      }
    });
    
    this.transferService.getAllScheduledTransfers(
      this.currentPage,
      this.pageSize,
      this.sortBy,
      this.sortDir,
      filters
    ).subscribe({
      next: (data) => {
        // Map backend fields to frontend display fields
        this.transfers = (data.content || []).map((transfer: any) => {
          return {
            ...transfer,
            // Map targetAccountNumber to destinationAccount for display
            destinationAccount: transfer.targetAccountNumber,
            // If status is not provided, derive it from active field
            status: transfer.status || (transfer.active ? 'ACTIVE' : 'INACTIVE'),
            // If nextExecutionDate is not provided, use startDate
            nextExecutionDate: transfer.nextExecutionDate || transfer.startDate
          };
        });
        
        this.totalItems = data.totalElements || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading scheduled transfers', error);
        this.showErrorMessage('Erreur lors du chargement des virements permanents');
        this.loading = false;
      }
    });
  }
  
  applyFilters(): void {
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadTransfers();
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      sourceAccount: '',
      destinationAccount: '',
      status: ''
    });
    this.currentPage = 0;
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }
    this.loadTransfers();
  }
  
  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadTransfers();
  }
  
  sortData(sort: Sort): void {
    this.sortBy = sort.active;
    
    // Map frontend column names to backend field names
    if (this.sortBy === 'destinationAccount') {
      this.sortBy = 'targetAccountNumber';
    } else if (this.sortBy === 'nextExecutionDate') {
      this.sortBy = 'startDate'; // Assuming nextExecutionDate maps to startDate
    } else if (this.sortBy === 'status') {
      this.sortBy = 'active'; // Map status to active field in backend
    }
    
    this.sortDir = sort.direction || 'asc';
    this.loadTransfers();
  }
  
  openTransferForm(transfer?: AdminScheduledTransfer): void {
    const dialogRef = this.dialog.open(AdminScheduledTransferFormComponent, {
      width: '600px',
      data: { transfer: transfer }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTransfers();
      }
    });
  }
  
  editTransfer(transfer: AdminScheduledTransfer): void {
    this.openTransferForm(transfer);
  }
  
  confirmDelete(transfer: AdminScheduledTransfer): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: `Êtes-vous sûr de vouloir supprimer ce virement permanent ?`,
        confirmText: 'Supprimer',
        cancelText: 'Annuler'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.deleteTransfer(transfer.id);
      }
    });
  }
  
  deleteTransfer(id: number): void {
    this.transferService.deleteScheduledTransfer(id).subscribe({
      next: () => {
        this.showSuccessMessage('Virement permanent supprimé avec succès');
        this.loadTransfers();
      },
      error: (error) => {
        console.error('Error deleting scheduled transfer', error);
        this.showErrorMessage('Erreur lors de la suppression du virement permanent');
      }
    });
  }
  
  getFrequencyLabel(frequency: string): string {
    switch (frequency) {
      case 'DAILY':
        return 'Quotidien';
      case 'WEEKLY':
        return 'Hebdomadaire';
      case 'MONTHLY':
        return 'Mensuel';
      case 'QUARTERLY':
        return 'Trimestriel';
      case 'YEARLY':
        return 'Annuel';
      default:
        return frequency;
    }
  }
  
  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Actif';
      case 'INACTIVE':
        return 'Inactif';
      case 'COMPLETED':
        return 'Terminé';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      case 'COMPLETED':
        return 'status-completed';
      case 'CANCELLED':
        return 'status-cancelled';
      default:
        return '';
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