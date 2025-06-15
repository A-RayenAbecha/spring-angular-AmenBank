import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpClient } from '@angular/common/http';

import { AdminScheduledTransferService, AdminScheduledTransfer } from '../../services/admin-scheduled-transfer.service';

interface BankAccount {
  id: number;
  accountNumber: string;
  iban?: string;
  balance?: number;
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

@Component({
  selector: 'app-admin-scheduled-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Modifier le virement permanent' : 'Ajouter un virement permanent' }}</h2>
    
    <div mat-dialog-content>
      <form [formGroup]="transferForm">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Compte source</mat-label>
            <mat-select formControlName="sourceAccount">
              <mat-option *ngFor="let account of accounts" [value]="account.accountNumber">
                {{ account.accountNumber }} - {{ account.user?.firstName }} {{ account.user?.lastName }} ({{ account.balance | currency:'EUR' }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="transferForm.get('sourceAccount')?.hasError('required')">
              Le compte source est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Compte destination</mat-label>
            <mat-select formControlName="destinationAccount">
              <mat-option *ngFor="let account of accounts" [value]="account.accountNumber">
                {{ account.accountNumber }} - {{ account.user?.firstName }} {{ account.user?.lastName }} ({{ account.balance | currency:'EUR' }})
              </mat-option>
            </mat-select>
            <mat-error *ngIf="transferForm.get('destinationAccount')?.hasError('required')">
              Le compte destination est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Montant</mat-label>
            <input matInput type="number" formControlName="amount" placeholder="0.00">
            <span matSuffix>€</span>
            <mat-error *ngIf="transferForm.get('amount')?.hasError('required')">
              Le montant est requis
            </mat-error>
            <mat-error *ngIf="transferForm.get('amount')?.hasError('min')">
              Le montant doit être supérieur à 0
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Fréquence</mat-label>
            <mat-select formControlName="frequency">
              <mat-option value="DAILY">Quotidien</mat-option>
              <mat-option value="WEEKLY">Hebdomadaire</mat-option>
              <mat-option value="MONTHLY">Mensuel</mat-option>
              <mat-option value="QUARTERLY">Trimestriel</mat-option>
              <mat-option value="YEARLY">Annuel</mat-option>
            </mat-select>
            <mat-error *ngIf="transferForm.get('frequency')?.hasError('required')">
              La fréquence est requise
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date de début</mat-label>
            <input matInput [matDatepicker]="startPicker" formControlName="startDate">
            <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
            <mat-error *ngIf="transferForm.get('startDate')?.hasError('required')">
              La date de début est requise
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Date de fin (optionnel)</mat-label>
            <input matInput [matDatepicker]="endPicker" formControlName="endDate">
            <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
            <mat-datepicker #endPicker></mat-datepicker>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" placeholder="Description du virement" rows="3"></textarea>
          </mat-form-field>
        </div>
        
        <div class="form-row" *ngIf="isEditMode">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Statut</mat-label>
            <mat-select formControlName="status">
              <mat-option value="ACTIVE">Actif</mat-option>
              <mat-option value="INACTIVE">Inactif</mat-option>
              <mat-option value="CANCELLED">Annulé</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </form>
      
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    </div>
    
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="transferForm.invalid || loading">
        {{ isEditMode ? 'Mettre à jour' : 'Ajouter' }}
      </button>
    </div>
  `,
  styles: [`
    .form-row {
      margin-bottom: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 16px;
    }
  `]
})
export class AdminScheduledTransferFormComponent implements OnInit {
  transferForm: FormGroup;
  isEditMode = false;
  loading = false;
  accounts: BankAccount[] = [];
  
  constructor(
    private fb: FormBuilder,
    private transferService: AdminScheduledTransferService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AdminScheduledTransferFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { transfer?: AdminScheduledTransfer }
  ) {
    this.transferForm = this.fb.group({
      sourceAccount: ['', Validators.required],
      destinationAccount: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]],
      frequency: ['MONTHLY', Validators.required],
      startDate: [new Date(), Validators.required],
      endDate: [null],
      description: [''],
      status: ['ACTIVE']
    });
    
    this.isEditMode = !!data?.transfer;
  }
  
  ngOnInit(): void {
    this.loadAccounts();
    
    if (this.isEditMode && this.data.transfer) {
      this.populateForm(this.data.transfer);
    }
  }
  
  loadAccounts(): void {
    this.loading = true;
    this.http.get<BankAccount[]>('http://localhost:8089/api/admin/accounts').subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts', error);
        this.showErrorMessage('Erreur lors du chargement des comptes');
        this.loading = false;
      }
    });
  }
  
  populateForm(transfer: AdminScheduledTransfer): void {
    this.transferForm.patchValue({
      sourceAccount: transfer.sourceAccount,
      destinationAccount: transfer.destinationAccount || transfer.targetAccountNumber,
      amount: transfer.amount,
      frequency: transfer.frequency,
      startDate: transfer.startDate ? new Date(transfer.startDate) : new Date(),
      endDate: transfer.endDate ? new Date(transfer.endDate) : null,
      description: transfer.description || '',
      status: transfer.status || (transfer.active ? 'ACTIVE' : 'INACTIVE')
    });
  }
  
  onSubmit(): void {
    if (this.transferForm.invalid) {
      return;
    }
    
    this.loading = true;
    const formValue = this.transferForm.value;
    
    // Find source account ID based on account number
    const sourceAccount = this.accounts.find(acc => acc.accountNumber === formValue.sourceAccount);
    
    const transfer: AdminScheduledTransfer = {
      id: this.isEditMode && this.data.transfer ? this.data.transfer.id : 0,
      sourceAccount: formValue.sourceAccount,
      sourceAccountId: sourceAccount?.id,
      destinationAccount: formValue.destinationAccount,
      targetAccountNumber: formValue.destinationAccount,
      amount: formValue.amount,
      frequency: formValue.frequency,
      nextExecutionDate: formValue.startDate.toISOString().split('T')[0],
      status: formValue.status,
      description: formValue.description,
      startDate: formValue.startDate.toISOString().split('T')[0],
      endDate: formValue.endDate ? formValue.endDate.toISOString().split('T')[0] : undefined,
      active: formValue.status === 'ACTIVE'
    };
    
    if (this.isEditMode) {
      this.updateTransfer(transfer);
    } else {
      this.createTransfer(transfer);
    }
  }
  
  createTransfer(transfer: AdminScheduledTransfer): void {
    this.transferService.createScheduledTransfer(transfer).subscribe({
      next: (response) => {
        this.loading = false;
        this.showSuccessMessage('Virement permanent créé avec succès');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating scheduled transfer', error);
        this.showErrorMessage('Erreur lors de la création du virement permanent');
      }
    });
  }
  
  updateTransfer(transfer: AdminScheduledTransfer): void {
    this.transferService.updateScheduledTransfer(transfer.id, transfer).subscribe({
      next: (response) => {
        this.loading = false;
        this.showSuccessMessage('Virement permanent mis à jour avec succès');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating scheduled transfer', error);
        this.showErrorMessage('Erreur lors de la mise à jour du virement permanent');
      }
    });
  }
  
  onCancel(): void {
    this.dialogRef.close(false);
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