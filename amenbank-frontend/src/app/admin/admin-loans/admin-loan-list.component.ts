import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdminLoanService } from '../../services/admin-loan.service';
import { LoanApplicationResponse, LoanStatus } from '../../models/credit.models';

@Component({
  selector: 'app-admin-loan-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="container">
      <mat-card class="loan-card">
        <mat-card-header>
          <mat-card-title>Gestion des Demandes de Crédit</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="filter-container">
            <mat-form-field>
              <mat-label>Filtrer par statut</mat-label>
              <mat-select [(value)]="selectedStatus" (selectionChange)="filterByStatus()">
                <mat-option [value]="null">Tous</mat-option>
                <mat-option [value]="LoanStatus.PENDING">En attente</mat-option>
                <mat-option [value]="LoanStatus.APPROVED">Approuvé</mat-option>
                <mat-option [value]="LoanStatus.REJECTED">Rejeté</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          
          <table mat-table [dataSource]="loanApplications" matSort (matSortChange)="sortData($event)" class="mat-elevation-z8">
            <ng-container matColumnDef="id">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
              <td mat-cell *matCellDef="let loan">{{ loan.id }}</td>
            </ng-container>
            
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Montant</th>
              <td mat-cell *matCellDef="let loan">{{ loan.amount | currency:'EUR' }}</td>
            </ng-container>
            
            <ng-container matColumnDef="termInMonths">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Durée (mois)</th>
              <td mat-cell *matCellDef="let loan">{{ loan.termInMonths }}</td>
            </ng-container>
            
            <ng-container matColumnDef="interestRate">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Taux d'intérêt</th>
              <td mat-cell *matCellDef="let loan">{{ loan.interestRate | percent:'1.2' }}</td>
            </ng-container>
            
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Statut</th>
              <td mat-cell *matCellDef="let loan">
                <mat-chip [ngClass]="getStatusClass(loan.status)">
                  {{ getStatusLabel(loan.status) }}
                </mat-chip>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let loan">
                <button mat-icon-button color="primary" [routerLink]="['/admin/loans', loan.id]">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent" (click)="approveLoan(loan)" *ngIf="loan.status === LoanStatus.PENDING">
                  <mat-icon>check_circle</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="rejectLoan(loan)" *ngIf="loan.status === LoanStatus.PENDING">
                  <mat-icon>cancel</mat-icon>
                </button>
              </td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          
          <mat-paginator 
            [length]="totalItems"
            [pageSize]="pageSize"
            [pageSizeOptions]="[5, 10, 25, 100]"
            (page)="onPageChange($event)">
          </mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
    }
    
    .loan-card {
      margin-bottom: 20px;
    }
    
    .filter-container {
      margin-bottom: 20px;
    }
    
    table {
      width: 100%;
    }
    
    .status-pending {
      background-color: #FFF59D;
      color: #F57F17;
    }
    
    .status-approved {
      background-color: #C8E6C9;
      color: #2E7D32;
    }
    
    .status-rejected {
      background-color: #FFCDD2;
      color: #C62828;
    }
  `]
})
export class AdminLoanListComponent implements OnInit {
  loanApplications: LoanApplicationResponse[] = [];
  displayedColumns: string[] = ['id', 'amount', 'termInMonths', 'interestRate', 'status', 'actions'];
  selectedStatus: LoanStatus | null = null;
  LoanStatus = LoanStatus;
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalItems = 0;
  
  constructor(
    private adminLoanService: AdminLoanService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadLoanApplications();
  }
  
  loadLoanApplications(): void {
    if (this.selectedStatus) {
      this.adminLoanService.getLoanApplicationsByStatus(this.selectedStatus).subscribe({
        next: (data) => {
          this.loanApplications = data;
          this.totalItems = data.length;
        },
        error: (error) => {
          console.error('Error loading loan applications', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          if (error.error) {
            console.error('Error details:', error.error);
          }
          
          let errorMessage = 'Erreur lors du chargement des demandes de crédit';
          if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur lors du chargement des demandes de crédit';
          }
          
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000
          });
        }
      });
    } else {
      this.adminLoanService.getAllLoanApplications().subscribe({
        next: (data) => {
          this.loanApplications = data;
          this.totalItems = data.length;
        },
        error: (error) => {
          console.error('Error loading loan applications', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          if (error.error) {
            console.error('Error details:', error.error);
          }
          
          let errorMessage = 'Erreur lors du chargement des demandes de crédit';
          if (error.status === 403) {
            errorMessage = 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource';
          } else if (error.status === 500) {
            errorMessage = 'Erreur serveur lors du chargement des demandes de crédit';
          }
          
          this.snackBar.open(errorMessage, 'Fermer', {
            duration: 5000
          });
        }
      });
    }
  }
  
  filterByStatus(): void {
    this.pageIndex = 0;
    this.loadLoanApplications();
  }
  
  sortData(sort: Sort): void {
    const data = this.loanApplications.slice();
    if (!sort.active || sort.direction === '') {
      this.loanApplications = data;
      return;
    }

    this.loanApplications = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'id': return this.compare(a.id, b.id, isAsc);
        case 'amount': return this.compare(a.amount, b.amount, isAsc);
        case 'termInMonths': return this.compare(a.termInMonths, b.termInMonths, isAsc);
        case 'interestRate': return this.compare(a.interestRate, b.interestRate, isAsc);
        case 'status': return this.compare(a.status, b.status, isAsc);
        default: return 0;
      }
    });
  }
  
  compare(a: number | string, b: number | string, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    // In a real application with server-side pagination, you would reload data here
  }
  
  getStatusClass(status: LoanStatus): string {
    switch (status) {
      case LoanStatus.PENDING:
        return 'status-pending';
      case LoanStatus.APPROVED:
        return 'status-approved';
      case LoanStatus.REJECTED:
        return 'status-rejected';
      default:
        return '';
    }
  }
  
  getStatusLabel(status: LoanStatus): string {
    switch (status) {
      case LoanStatus.PENDING:
        return 'En attente';
      case LoanStatus.APPROVED:
        return 'Approuvé';
      case LoanStatus.REJECTED:
        return 'Rejeté';
      default:
        return status;
    }
  }
  
  approveLoan(loan: LoanApplicationResponse): void {
    this.adminLoanService.updateLoanStatus(loan.id, LoanStatus.APPROVED).subscribe({
      next: () => {
        this.snackBar.open('Demande de crédit approuvée', 'Fermer', {
          duration: 3000
        });
        this.loadLoanApplications();
      },
      error: (error) => {
        console.error('Error approving loan', error);
        this.snackBar.open('Erreur lors de l\'approbation de la demande', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
  
  rejectLoan(loan: LoanApplicationResponse): void {
    this.adminLoanService.updateLoanStatus(loan.id, LoanStatus.REJECTED).subscribe({
      next: () => {
        this.snackBar.open('Demande de crédit rejetée', 'Fermer', {
          duration: 3000
        });
        this.loadLoanApplications();
      },
      error: (error) => {
        console.error('Error rejecting loan', error);
        this.snackBar.open('Erreur lors du rejet de la demande', 'Fermer', {
          duration: 3000
        });
      }
    });
  }
} 