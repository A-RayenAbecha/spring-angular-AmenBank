import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { CreditService } from '../../services/credit.service';
import { BankAccountService } from '../../services/bank-account.service';
import { ThemeService } from '../../services/theme.service';
import { LoanStatus } from '../../models/credit.models';
import { BankAccountDTO } from '../../models/bank-account.model';

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="loan-application">
      <mat-card class="application-form">
        <mat-card-header>
          <mat-card-title>Demande de Crédit</mat-card-title>
          <mat-card-subtitle>
            Remplissez le formulaire ci-dessous pour soumettre votre demande de crédit
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="applicationForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Compte bancaire</mat-label>
              <mat-select formControlName="accountId">
                <mat-option *ngFor="let account of accounts" [value]="account.id">
                  {{ account.accountNumber }} - Solde: {{ account.balance | number:'1.2-2' }} TND
                </mat-option>
              </mat-select>
              <mat-error *ngIf="applicationForm.get('accountId')?.hasError('required')">
                Veuillez sélectionner un compte
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Montant du crédit (TND)</mat-label>
              <input matInput type="number" formControlName="amount" min="0">
              <mat-error *ngIf="applicationForm.get('amount')?.hasError('required')">
                Le montant est requis
              </mat-error>
              <mat-error *ngIf="applicationForm.get('amount')?.hasError('min')">
                Le montant doit être positif
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Durée (mois)</mat-label>
              <input matInput type="number" formControlName="termInMonths" min="1" max="360">
              <mat-error *ngIf="applicationForm.get('termInMonths')?.hasError('required')">
                La durée est requise
              </mat-error>
              <mat-error *ngIf="applicationForm.get('termInMonths')?.hasError('min')">
                La durée minimum est de 1 mois
              </mat-error>
              <mat-error *ngIf="applicationForm.get('termInMonths')?.hasError('max')">
                La durée maximum est de 360 mois
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="applicationForm.invalid || loading"
                      class="submit-btn">
                {{ loading ? 'Envoi en cours...' : 'Soumettre la demande' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="applications-list" *ngIf="myApplications.length > 0">
        <mat-card-header>
          <mat-card-title>Mes demandes de crédit</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="applications-grid">
            <div class="application-item" *ngFor="let application of myApplications">
              <div class="application-header">
                <span class="application-id">#{{ application.id }}</span>
                <span class="application-status" [ngClass]="application.status.toLowerCase()">
                  {{ getStatusLabel(application.status) }}
                </span>
              </div>
              <div class="application-details">
                <div class="detail-item">
                  <span class="label">Montant:</span>
                  <span class="value">{{ application.amount | number:'1.2-2' }} TND</span>
                </div>
                <div class="detail-item">
                  <span class="label">Durée:</span>
                  <span class="value">{{ application.termInMonths }} mois</span>
                </div>
                <div class="detail-item">
                  <span class="label">Taux:</span>
                  <span class="value">{{ application.interestRate }}%</span>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .loan-application {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-6);
      background-color: var(--background);
      min-height: 100vh;
      transition: var(--theme-transition);
    }

    .application-form {
      margin-bottom: var(--spacing-8);
      background-color: var(--surface) !important;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      transition: var(--theme-transition);
      
      &:hover {
        box-shadow: var(--shadow-lg);
      }
    }

    .applications-list {
      background-color: var(--surface) !important;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      transition: var(--theme-transition);
    }

    :host ::ng-deep .mat-mdc-card-header {
      .mat-mdc-card-title {
        color: var(--text-primary) !important;
        font-size: var(--font-size-2xl);
        font-weight: 600;
      }
      
      .mat-mdc-card-subtitle {
        color: var(--text-secondary) !important;
        font-size: var(--font-size-sm);
        margin-top: var(--spacing-2);
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: var(--spacing-4);
    }

    :host ::ng-deep .mat-mdc-form-field {
      .mdc-notched-outline {
        border-color: var(--border) !important;
        transition: var(--theme-transition);
      }
      
      &:hover .mdc-notched-outline {
        border-color: var(--border-hover) !important;
      }
      
      &.mat-focused .mdc-notched-outline {
        border-color: var(--primary) !important;
        border-width: 2px;
      }
      
      .mat-mdc-input-element {
        color: var(--text-primary) !important;
        caret-color: var(--primary) !important;
      }
      
      .mat-mdc-form-field-label {
        color: var(--text-secondary) !important;
      }
      
      &.mat-focused .mat-mdc-form-field-label {
        color: var(--primary) !important;
      }
      
      .mat-mdc-select-value {
        color: var(--text-primary) !important;
      }
      
      .mat-mdc-select-arrow {
        color: var(--text-secondary) !important;
      }
    }

    :host ::ng-deep .mat-mdc-form-field-error {
      color: var(--error) !important;
      font-size: 12px;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-6);
      gap: var(--spacing-3);
    }

    .submit-btn {
      background-color: var(--primary) !important;
      color: white !important;
      border-radius: var(--radius-md);
      padding: var(--spacing-3) var(--spacing-6);
      font-weight: 500;
      text-transform: none;
      letter-spacing: 0.025em;
      transition: var(--theme-transition);
      
      &:hover:not(:disabled) {
        background-color: var(--primary-hover) !important;
        transform: translateY(-1px);
        box-shadow: var(--shadow-lg);
      }
      
      &:disabled {
        background-color: var(--surface-disabled) !important;
        color: var(--text-disabled) !important;
        cursor: not-allowed;
      }
    }

    .applications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--spacing-6);
      margin-top: var(--spacing-6);
    }

    .application-item {
      background-color: var(--surface-variant);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--spacing-6);
      transition: var(--theme-transition);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
        border-color: var(--border-hover);
      }
    }

    .application-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-4);
      padding-bottom: var(--spacing-3);
      border-bottom: 1px solid var(--border);
    }

    .application-id {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .application-status {
      padding: var(--spacing-2) var(--spacing-3);
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      transition: var(--theme-transition);
    }

    .application-status.pending {
      background-color: var(--warning-light);
      color: var(--warning-dark);
      border: 1px solid var(--warning);
    }

    .application-status.approved {
      background-color: var(--success-light);
      color: var(--success-dark);
      border: 1px solid var(--success);
    }

    .application-status.rejected {
      background-color: var(--error-light);
      color: var(--error-dark);
      border: 1px solid var(--error);
    }

    .application-details {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-3);
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--spacing-2) 0;
    }

    .detail-item .label {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);
      font-weight: 500;
    }

    .detail-item .value {
      font-weight: 600;
      color: var(--text-primary);
      font-size: var(--font-size-sm);
    }

    // Enhanced Material Select styling
    :host ::ng-deep .mat-mdc-select-panel {
      background-color: var(--surface) !important;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      margin-top: 8px;
    }

    :host ::ng-deep .mat-mdc-option {
      color: var(--text-primary) !important;
      transition: var(--theme-transition);
      
      &:hover {
        background-color: var(--surface-hover) !important;
      }
      
      &.mdc-list-item--selected {
        background-color: var(--primary-alpha) !important;
        color: var(--primary) !important;
      }
    }

    // Loading spinner styling
    :host ::ng-deep .mat-mdc-progress-spinner {
      .mdc-circular-progress__determinate-circle,
      .mdc-circular-progress__indeterminate-circle-graphic {
        stroke: var(--primary) !important;
      }
    }

    // Responsive design
    @media (max-width: 768px) {
      .loan-application {
        padding: var(--spacing-4);
      }

      .applications-grid {
        grid-template-columns: 1fr;
        gap: var(--spacing-4);
      }

      .application-item {
        padding: var(--spacing-4);
      }

      .form-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .submit-btn {
        width: 100%;
        justify-content: center;
      }
    }

    @media (max-width: 480px) {
      .application-header {
        flex-direction: column;
        gap: var(--spacing-2);
        align-items: flex-start;
      }

      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--spacing-1);
      }
    }

    // High contrast mode support
    @media (prefers-contrast: high) {
      .application-item {
        border-width: 2px;
      }
      
      .application-status {
        border-width: 2px;
      }
    }

    // Reduced motion support
    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
        animation: none !important;
      }
      
      .application-item:hover {
        transform: none;
      }
      
      .submit-btn:hover:not(:disabled) {
        transform: none;
      }
    }
  `]
})
export class LoanApplicationComponent implements OnInit, OnDestroy {
  applicationForm: FormGroup;
  loading = false;
  accounts: BankAccountDTO[] = [];
  myApplications: any[] = [];
  isDarkTheme = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private creditService: CreditService,
    private accountService: BankAccountService,
    private snackBar: MatSnackBar,
    private themeService: ThemeService
  ) {
    this.applicationForm = this.fb.group({
      accountId: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(0)]],
      termInMonths: ['', [Validators.required, Validators.min(1), Validators.max(360)]]
    });
  }

  ngOnInit() {
    this.loadAccounts();
    this.loadMyApplications();
    
    // Subscribe to theme changes
    this.themeService.isDarkTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkTheme = isDark;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAccounts() {
    this.accountService.getCurrentUserAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.showErrorMessage('Erreur lors du chargement des comptes');
      }
    });
  }

  loadMyApplications() {
    this.creditService.getMyLoanApplications().subscribe({
      next: (applications) => {
        this.myApplications = applications;
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.showErrorMessage('Erreur lors du chargement des demandes');
      }
    });
  }

  onSubmit() {
    if (this.applicationForm.valid) {
      this.loading = true;
      
      // Create request object with fixed interest rate
      const request = {
        ...this.applicationForm.value,
        interestRate: 5.5 // Fixed interest rate of 5.5%
      };
      
      this.creditService.applyForLoan(request).subscribe({
        next: (response) => {
          this.loading = false;
          this.showSuccessMessage('Demande de crédit soumise avec succès');
          this.applicationForm.reset();
          this.loadMyApplications();
        },
        error: (error) => {
          this.loading = false;
          console.error('Error submitting loan application:', error);
          this.showErrorMessage('Erreur lors de la soumission de la demande');
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
        return 'Refusé';
      default:
        return status;
    }
  }

  private showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 4000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}