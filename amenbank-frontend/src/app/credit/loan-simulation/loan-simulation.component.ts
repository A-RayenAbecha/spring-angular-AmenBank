import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CreditService } from '../../services/credit.service';
import { LoanSimulationResponse, Installment } from '../../models/credit.models';

@Component({
  selector: 'app-loan-simulation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="loan-simulation">
      <mat-card class="simulation-form">
        <mat-card-header>
          <mat-card-title>Simulation de Crédit</mat-card-title>
          <mat-card-subtitle>
            Calculez vos mensualités et obtenez un échéancier détaillé
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="simulationForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Montant du crédit (TND)</mat-label>
              <input matInput type="number" formControlName="amount" min="0">
              <mat-error *ngIf="simulationForm.get('amount')?.hasError('required')">
                Le montant est requis
              </mat-error>
              <mat-error *ngIf="simulationForm.get('amount')?.hasError('min')">
                Le montant doit être positif
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Durée (mois)</mat-label>
              <input matInput type="number" formControlName="termInMonths" min="1" max="360">
              <mat-error *ngIf="simulationForm.get('termInMonths')?.hasError('required')">
                La durée est requise
              </mat-error>
              <mat-error *ngIf="simulationForm.get('termInMonths')?.hasError('min')">
                La durée minimum est de 1 mois
              </mat-error>
              <mat-error *ngIf="simulationForm.get('termInMonths')?.hasError('max')">
                La durée maximum est de 360 mois
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Taux d'intérêt annuel (%)</mat-label>
              <input matInput type="number" formControlName="interestRate" min="0" max="100">
              <mat-error *ngIf="simulationForm.get('interestRate')?.hasError('required')">
                Le taux d'intérêt est requis
              </mat-error>
              <mat-error *ngIf="simulationForm.get('interestRate')?.hasError('min')">
                Le taux doit être positif
              </mat-error>
              <mat-error *ngIf="simulationForm.get('interestRate')?.hasError('max')">
                Le taux maximum est de 100%
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="simulationForm.invalid || loading"
                      class="submit-btn">
                {{ loading ? 'Calcul en cours...' : 'Calculer' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <div class="simulation-results" *ngIf="simulationResult">
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title>Résultats de la simulation</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="summary">
              <div class="summary-item">
                <span class="label">Mensualité:</span>
                <span class="value">{{ simulationResult.monthlyPayment | number:'1.2-2' }} TND</span>
              </div>
              <div class="summary-item">
                <span class="label">Coût total:</span>
                <span class="value">{{ simulationResult.totalPayment | number:'1.2-2' }} TND</span>
              </div>
            </div>

            <div class="table-container">
              <table mat-table [dataSource]="simulationResult.schedule" class="schedule-table">
                <ng-container matColumnDef="month">
                  <th mat-header-cell *matHeaderCellDef>Mois</th>
                  <td mat-cell *matCellDef="let row">{{ row.month }}</td>
                </ng-container>

                <ng-container matColumnDef="principal">
                  <th mat-header-cell *matHeaderCellDef>Capital</th>
                  <td mat-cell *matCellDef="let row">{{ row.principal | number:'1.2-2' }} TND</td>
                </ng-container>

                <ng-container matColumnDef="interest">
                  <th mat-header-cell *matHeaderCellDef>Intérêts</th>
                  <td mat-cell *matCellDef="let row">{{ row.interest | number:'1.2-2' }} TND</td>
                </ng-container>

                <ng-container matColumnDef="total">
                  <th mat-header-cell *matHeaderCellDef>Total</th>
                  <td mat-cell *matCellDef="let row">{{ row.total | number:'1.2-2' }} TND</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .loan-simulation {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--spacing-6);
      background-color: var(--background);
      min-height: 100vh;
      transition: var(--theme-transition);
    }

    .simulation-form {
      margin-bottom: var(--spacing-8);
      background-color: var(--surface) !important;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      transition: var(--theme-transition);
    }

    .simulation-form mat-card-header {
      mat-card-title {
        color: var(--text-primary) !important;
        font-size: var(--font-size-2xl) !important;
        font-weight: 600;
      }
      
      mat-card-subtitle {
        color: var(--text-secondary) !important;
        margin-top: var(--spacing-2) !important;
      }
    }

    .full-width {
      width: 100%;
      margin-bottom: var(--spacing-4);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-4);
    }

    .submit-btn {
      background-color: var(--primary) !important;
      color: white !important;
      border: none;
      padding: var(--spacing-3) var(--spacing-6) !important;
      border-radius: var(--radius-lg);
      font-weight: 500;
      transition: var(--theme-transition);
      
      &:hover:not([disabled]) {
        background-color: var(--primary-hover) !important;
        box-shadow: var(--shadow);
        transform: translateY(-1px);
      }
      
      &[disabled] {
        background-color: var(--surface-disabled) !important;
        color: var(--text-disabled) !important;
      }
    }

    .simulation-results {
      margin-top: var(--spacing-8);
    }

    .results-card {
      background-color: var(--surface) !important;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      transition: var(--theme-transition);
      
      mat-card-header {
        mat-card-title {
          color: var(--text-primary) !important;
          font-size: var(--font-size-xl) !important;
          font-weight: 600;
        }
      }
    }

    .summary {
      display: flex;
      gap: var(--spacing-8);
      margin-bottom: var(--spacing-6);
      padding: var(--spacing-6);
      background-color: var(--surface-variant);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      transition: var(--theme-transition);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-2);
    }

    .summary-item .label {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      font-weight: 500;
    }

    .summary-item .value {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: var(--primary);
    }

    .table-container {
      border-radius: var(--radius-lg);
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .schedule-table {
      width: 100%;
      background-color: var(--surface) !important;
      
      th {
        background-color: var(--surface-variant) !important;
        color: var(--text-primary) !important;
        font-weight: 600;
        border-bottom: 1px solid var(--border) !important;
      }
      
      td {
        color: var(--text-primary) !important;
        border-bottom: 1px solid var(--border) !important;
      }
      
      tr:hover {
        background-color: var(--surface-hover) !important;
      }
    }

    /* Material Design form field overrides */
    :host ::ng-deep {
      .mat-mdc-form-field {
        .mat-mdc-text-field-wrapper {
          background-color: var(--surface);
          border-radius: var(--radius-md);
        }
        
        .mat-mdc-form-field-outline {
          color: var(--border);
        }
        
        &.mat-focused .mat-mdc-form-field-outline-thick {
          color: var(--primary);
        }
        
        .mat-mdc-input-element {
          color: var(--text-primary) !important;
          
          &::placeholder {
            color: var(--text-secondary) !important;
          }
        }
        
        .mat-mdc-floating-label {
          color: var(--text-secondary) !important;
        }
        
        &.mat-focused .mat-mdc-floating-label {
          color: var(--primary) !important;
        }
      }
      
      .mat-mdc-form-field-error {
        color: var(--error) !important;
      }
    }

    // Responsive design
    @media (max-width: 768px) {
      .loan-simulation {
        padding: var(--spacing-3);
      }

      .summary {
        flex-direction: column;
        gap: var(--spacing-4);
      }

      .table-container {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }
      
      .schedule-table {
        min-width: 500px;
      }
    }

    @media (max-width: 480px) {
      .summary-item .value {
        font-size: var(--font-size-xl);
      }
    }
  `]
})
export class LoanSimulationComponent {
  simulationForm: FormGroup;
  loading = false;
  simulationResult: LoanSimulationResponse | null = null;
  displayedColumns: string[] = ['month', 'principal', 'interest', 'total'];

  constructor(
    private fb: FormBuilder,
    private creditService: CreditService
  ) {
    this.simulationForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0)]],
      termInMonths: ['', [Validators.required, Validators.min(1), Validators.max(360)]],
      interestRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  onSubmit() {
    if (this.simulationForm.valid) {
      this.loading = true;
      this.creditService.simulateLoan(this.simulationForm.value)
        .subscribe({
          next: (result) => {
            this.simulationResult = result;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error simulating loan:', error);
            this.loading = false;
          }
        });
    }
  }
}