import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { AdminLoanService } from '../../services/admin-loan.service';
import { LoanApplicationResponse, LoanStatus } from '../../models/credit.models';

@Component({
  selector: 'app-admin-loan-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <div class="container" *ngIf="loanApplication">
      <mat-card class="loan-card">
        <mat-card-header>
          <div class="header-actions">
            <button mat-icon-button color="primary" routerLink="/admin/loans">
              <mat-icon>arrow_back</mat-icon>
            </button>
          </div>
          <mat-card-title>Détails de la Demande de Crédit #{{ loanApplication.id }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loanForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Montant</mat-label>
                <input matInput type="number" formControlName="amount" required>
                <span matSuffix>€</span>
                <mat-error *ngIf="loanForm.get('amount')?.hasError('required')">
                  Le montant est requis
                </mat-error>
                <mat-error *ngIf="loanForm.get('amount')?.hasError('min')">
                  Le montant doit être supérieur à 0
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Durée (mois)</mat-label>
                <input matInput type="number" formControlName="termInMonths" required>
                <mat-error *ngIf="loanForm.get('termInMonths')?.hasError('required')">
                  La durée est requise
                </mat-error>
                <mat-error *ngIf="loanForm.get('termInMonths')?.hasError('min')">
                  La durée doit être d'au moins 1 mois
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Taux d'intérêt</mat-label>
                <input matInput type="number" formControlName="interestRate" required>
                <span matSuffix>%</span>
                <mat-hint>Ajustez le taux d'intérêt selon la politique de crédit</mat-hint>
                <mat-error *ngIf="loanForm.get('interestRate')?.hasError('required')">
                  Le taux d'intérêt est requis
                </mat-error>
                <mat-error *ngIf="loanForm.get('interestRate')?.hasError('min')">
                  Le taux d'intérêt doit être supérieur à 0
                </mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Statut</mat-label>
                <mat-select formControlName="status" required>
                  <mat-option [value]="LoanStatus.PENDING">En attente</mat-option>
                  <mat-option [value]="LoanStatus.APPROVED">Approuvé</mat-option>
                  <mat-option [value]="LoanStatus.REJECTED">Rejeté</mat-option>
                </mat-select>
                <mat-error *ngIf="loanForm.get('status')?.hasError('required')">
                  Le statut est requis
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>ID du compte</mat-label>
                <input matInput type="number" formControlName="accountId" required>
                <mat-error *ngIf="loanForm.get('accountId')?.hasError('required')">
                  L'ID du compte est requis
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="button-row">
              <button mat-raised-button color="primary" type="submit" [disabled]="loanForm.invalid || isSubmitting">
                Mettre à jour
              </button>
              <button mat-raised-button color="warn" type="button" (click)="deleteLoan()" [disabled]="isSubmitting">
                Supprimer
              </button>
            </div>
          </form>
          
          <mat-divider class="divider"></mat-divider>
          
          <div class="status-actions" *ngIf="loanApplication.status === LoanStatus.PENDING">
            <h3>Actions rapides</h3>
            <div class="button-row">
              <button mat-raised-button color="accent" (click)="approveLoan()" [disabled]="isSubmitting">
                Approuver la demande
              </button>
              <button mat-raised-button color="warn" (click)="rejectLoan()" [disabled]="isSubmitting">
                Rejeter la demande
              </button>
            </div>
          </div>
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
    
    .header-actions {
      margin-right: 16px;
    }
    
    .form-row {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .button-row {
      display: flex;
      gap: 16px;
      margin: 16px 0;
    }
    
    .divider {
      margin: 24px 0;
    }
    
    .status-actions {
      margin-top: 16px;
    }
  `]
})
export class AdminLoanDetailComponent implements OnInit {
  loanApplication: LoanApplicationResponse | null = null;
  loanForm: FormGroup;
  isSubmitting = false;
  LoanStatus = LoanStatus;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminLoanService: AdminLoanService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.loanForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      termInMonths: [0, [Validators.required, Validators.min(1)]],
      interestRate: [0, [Validators.required, Validators.min(0.01)]],
      status: ['', [Validators.required]],
      accountId: [0, [Validators.required]]
    });
  }
  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadLoanApplication(Number(id));
    } else {
      this.router.navigate(['/admin/loans']);
    }
  }
  
  loadLoanApplication(id: number): void {
    this.adminLoanService.getLoanApplicationById(id).subscribe({
      next: (data) => {
        this.loanApplication = data;
        this.loanForm.patchValue({
          amount: data.amount,
          termInMonths: data.termInMonths,
          interestRate: data.interestRate * 100, // Convert to percentage for display
          status: data.status,
          accountId: data.accountId
        });
      },
      error: (error) => {
        console.error('Error loading loan application', error);
        this.snackBar.open('Erreur lors du chargement de la demande de crédit', 'Fermer', {
          duration: 3000
        });
        this.router.navigate(['/admin/loans']);
      }
    });
  }
  
  onSubmit(): void {
    if (this.loanForm.invalid || !this.loanApplication) {
      return;
    }
    
    this.isSubmitting = true;
    const formValues = this.loanForm.value;
    
    const request = {
      amount: formValues.amount,
      termInMonths: formValues.termInMonths,
      interestRate: formValues.interestRate / 100, // Convert from percentage
      accountId: formValues.accountId
    };
    
    this.adminLoanService.updateLoanApplication(this.loanApplication.id, request).subscribe({
      next: (data) => {
        this.loanApplication = data;
        this.snackBar.open('Demande de crédit mise à jour avec succès', 'Fermer', {
          duration: 3000
        });
        this.isSubmitting = false;
        
        // If status was changed in the form, update it separately
        if (formValues.status !== data.status) {
          this.updateStatus(formValues.status);
        } else {
          // Redirect to loan list after successful update
          this.router.navigate(['/admin/loans']);
        }
      },
      error: (error) => {
        console.error('Error updating loan application', error);
        this.snackBar.open('Erreur lors de la mise à jour de la demande', 'Fermer', {
          duration: 3000
        });
        this.isSubmitting = false;
      }
    });
  }
  
  updateStatus(status: LoanStatus): void {
    if (!this.loanApplication) return;
    
    this.isSubmitting = true;
    console.log(`Attempting to update loan status for ID ${this.loanApplication.id} to ${status}`);
    
    // Log the actual URL being requested to help with debugging
    console.log(`Sending request to: ${this.adminLoanService['apiUrl']}/${this.loanApplication.id}/status`);
    
    this.adminLoanService.updateLoanStatus(this.loanApplication.id, status).subscribe({
      next: (data) => {
        console.log('Status update successful:', data);
        this.loanApplication = data;
        this.loanForm.patchValue({
          status: data.status
        });
        this.snackBar.open(`Statut mis à jour: ${this.getStatusLabel(status)}`, 'Fermer', {
          duration: 3000
        });
        this.isSubmitting = false;
        
        // Redirect to loan list after successful status update
        setTimeout(() => {
          this.router.navigate(['/admin/loans']);
        }, 1000); // Small delay to allow the user to see the success message
      },
      error: (error) => {
        console.error('Error updating loan status', error);
        console.error('Error status code:', error.status);
        console.error('Error message:', error.message);
        console.error('Error response:', error.error);
        
        let errorMessage = 'Erreur lors de la mise à jour du statut';
        
        if (error.status === 0) {
          errorMessage = 'Problème de connexion au serveur. Veuillez vérifier votre connexion réseau.';
        } else if (error.status === 403) {
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour effectuer cette action.';
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur lors de la mise à jour du statut.';
        }
        
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000
        });
        this.isSubmitting = false;
      }
    });
  }
  
  approveLoan(): void {
    if (!this.loanApplication) return;
    this.updateStatus(LoanStatus.APPROVED);
  }
  
  rejectLoan(): void {
    if (!this.loanApplication) return;
    this.updateStatus(LoanStatus.REJECTED);
  }
  
  deleteLoan(): void {
    if (!this.loanApplication) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette demande de crédit ?')) {
      this.isSubmitting = true;
      this.adminLoanService.deleteLoanApplication(this.loanApplication.id).subscribe({
        next: () => {
          this.snackBar.open('Demande de crédit supprimée', 'Fermer', {
            duration: 3000
          });
          this.router.navigate(['/admin/loans']);
        },
        error: (error) => {
          console.error('Error deleting loan application', error);
          this.snackBar.open('Erreur lors de la suppression de la demande', 'Fermer', {
            duration: 3000
          });
          this.isSubmitting = false;
        }
      });
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
} 