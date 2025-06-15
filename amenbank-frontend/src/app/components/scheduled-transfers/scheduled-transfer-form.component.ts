import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScheduledTransferService } from '../../services/scheduled-transfer.service';
import { ScheduledTransfer, Frequency } from '../../models/scheduled-transfer';
import { ClientService } from '../../services/client.service';
import { BankAccount } from '../../models/client.models';

@Component({
  selector: 'app-scheduled-transfer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{data.mode === 'create' ? 'Nouveau Virement Permanent' : 'Modifier le Virement Permanent'}}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4">
        <mat-form-field>
          <mat-label>Compte source</mat-label>
          <mat-select formControlName="sourceAccountId" required>
            <mat-option *ngFor="let account of userAccounts" [value]="account.id">
              {{account.accountNumber}}
            </mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('sourceAccountId')?.hasError('required')">
            Le compte source est requis
          </mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Compte destinataire</mat-label>
          <input matInput formControlName="targetAccountNumber" required 
                 placeholder="Numéro du compte destinataire">
          <mat-error *ngIf="form.get('targetAccountNumber')?.hasError('required')">
            Le compte destinataire est requis
          </mat-error>
          <mat-error *ngIf="form.get('targetAccountNumber')?.hasError('invalidAccount')">
            Ce compte n'existe pas
          </mat-error>
          <mat-error *ngIf="form.get('targetAccountNumber')?.hasError('validationError')">
            Erreur lors de la validation du compte
          </mat-error>
          <mat-progress-spinner *ngIf="isValidatingAccount" 
                              diameter="20" 
                              mode="indeterminate">
          </mat-progress-spinner>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Montant</mat-label>
          <input matInput type="number" formControlName="amount" required>
          <mat-error *ngIf="form.get('amount')?.hasError('required')">
            Le montant est requis
          </mat-error>
          <mat-error *ngIf="form.get('amount')?.hasError('min')">
            Le montant doit être supérieur à 0
          </mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Fréquence</mat-label>
          <mat-select formControlName="frequency" required>
            <mat-option [value]="Frequency.DAILY">Quotidien</mat-option>
            <mat-option [value]="Frequency.WEEKLY">Hebdomadaire</mat-option>
            <mat-option [value]="Frequency.MONTHLY">Mensuel</mat-option>
          </mat-select>
          <mat-error *ngIf="form.get('frequency')?.hasError('required')">
            La fréquence est requise
          </mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Date de début</mat-label>
          <input matInput [matDatepicker]="startPicker" formControlName="startDate" required>
          <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
          <mat-datepicker #startPicker></mat-datepicker>
          <mat-error *ngIf="form.get('startDate')?.hasError('required')">
            La date de début est requise
          </mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Date de fin</mat-label>
          <input matInput [matDatepicker]="endPicker" formControlName="endDate" required>
          <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
          <mat-datepicker #endPicker></mat-datepicker>
          <mat-error *ngIf="form.get('endDate')?.hasError('required')">
            La date de fin est requise
          </mat-error>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="form.invalid">
        {{data.mode === 'create' ? 'Créer' : 'Modifier'}}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      max-width: 500px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 0;
    }

    mat-form-field {
      width: 100%;
    }

    mat-dialog-actions {
      padding: 1rem 0;
    }
  `]
})
export class ScheduledTransferFormComponent implements OnInit {
  form: FormGroup;
  Frequency = Frequency;
  userAccounts: BankAccount[] = [];
  isValidatingAccount = false;

  constructor(
    private fb: FormBuilder,
    private scheduledTransferService: ScheduledTransferService,
    private clientService: ClientService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ScheduledTransferFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      mode: 'create' | 'edit';
      transfer?: ScheduledTransfer;
    }
  ) {
    this.form = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      frequency: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      targetAccountNumber: ['', [Validators.required]],
      sourceAccountId: ['', [Validators.required]],
      description: ['']
    });

    // Add target account validation on change
    this.form.get('targetAccountNumber')?.valueChanges.subscribe(value => {
      if (value) {
        this.validateTargetAccount(value);
      }
    });
  }

  ngOnInit() {
    // Load user's accounts
    this.clientService.getCurrentUserAccounts().subscribe({
      next: (accounts) => {
        this.userAccounts = accounts;
        
        // If editing, patch the form with existing values
        if (this.data.mode === 'edit' && this.data.transfer) {
          this.form.patchValue({
            amount: this.data.transfer.amount,
            frequency: this.data.transfer.frequency,
            startDate: new Date(this.data.transfer.startDate),
            endDate: new Date(this.data.transfer.endDate),
            targetAccountNumber: this.data.transfer.targetAccountNumber,
            sourceAccountId: this.data.transfer.sourceAccountId,
            description: this.data.transfer.description
          });
        }
      },
      error: (error) => {
        console.error('Error loading accounts:', error);
        this.snackBar.open('Erreur lors du chargement des comptes', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  validateTargetAccount(accountNumber: string) {
    this.isValidatingAccount = true;
    this.scheduledTransferService.validateAccount(accountNumber).subscribe({
      next: (isValid) => {
        this.isValidatingAccount = false;
        if (!isValid) {
          this.form.get('targetAccountNumber')?.setErrors({ invalidAccount: true });
          this.snackBar.open('Ce compte destinataire n\'existe pas', 'Fermer', {
            duration: 3000
          });
        }
      },
      error: () => {
        this.isValidatingAccount = false;
        this.form.get('targetAccountNumber')?.setErrors({ validationError: true });
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      
      // Format the request
      const request = {
        amount: formValue.amount,
        startDate: this.formatDate(formValue.startDate),
        endDate: this.formatDate(formValue.endDate),
        frequency: formValue.frequency,
        description: formValue.description || '',
        sourceAccountId: Number(formValue.sourceAccountId),
        targetAccountNumber: formValue.targetAccountNumber // Use the input value as account number
      };

      if (this.data.mode === 'create') {
        this.scheduledTransferService.createScheduledTransfer(request).subscribe({
          next: () => {
            this.snackBar.open('Virement permanent créé avec succès', 'Fermer', {
              duration: 3000
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error creating transfer:', error);
            this.snackBar.open(
              error.error?.message || 'Erreur lors de la création du virement',
              'Fermer',
              { duration: 3000 }
            );
          }
        });
      } else if (this.data.mode === 'edit' && this.data.transfer) {
        const updateRequest = {
          ...request,
          active: true
        };
        
        this.scheduledTransferService.updateScheduledTransfer(this.data.transfer.id!, updateRequest).subscribe({
          next: () => {
            this.snackBar.open('Virement permanent modifié avec succès', 'Fermer', {
              duration: 3000
            });
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error updating transfer:', error);
            this.snackBar.open(
              error.error?.message || 'Erreur lors de la modification du virement',
              'Fermer',
              { duration: 3000 }
            );
          }
        });
      }
    }
  }
} 