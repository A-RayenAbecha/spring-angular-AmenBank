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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map, startWith } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

import { AdminBankAccountService } from '../../services/admin-bank-account.service';
import { BankAccount } from '../../models/client.models';
import { UserService, User } from '../../services/user-service.service';

@Component({
  selector: 'app-admin-account-form',
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
    MatAutocompleteModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Modifier le compte' : 'Ajouter un compte' }}</h2>
    
    <div mat-dialog-content>
      <form [formGroup]="accountForm">
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>IBAN</mat-label>
            <input matInput formControlName="iban" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX">
            <mat-error *ngIf="accountForm.get('iban')?.hasError('required')">
              L'IBAN est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Numéro de compte</mat-label>
            <input matInput formControlName="accountNumber" placeholder="XXXXXXXX">
            <mat-error *ngIf="accountForm.get('accountNumber')?.hasError('required')">
              Le numéro de compte est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Solde</mat-label>
            <input matInput type="number" formControlName="balance" placeholder="0.00">
            <span matSuffix>€</span>
            <mat-error *ngIf="accountForm.get('balance')?.hasError('required')">
              Le solde est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Type de compte</mat-label>
            <mat-select formControlName="type">
              <mat-option *ngFor="let type of accountTypes" [value]="type">
                {{ getAccountTypeLabel(type) }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="accountForm.get('type')?.hasError('required')">
              Le type de compte est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Propriétaire</mat-label>
            <input matInput
                   formControlName="userSearch"
                   placeholder="Rechercher un utilisateur"
                   [matAutocomplete]="auto">
            <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onUserSelected($event)">
              <mat-option *ngFor="let user of filteredUsers | async" [value]="user.id">
                {{ user.firstName || '' }} {{ user.lastName || '' }} ({{ user.username }})
              </mat-option>
            </mat-autocomplete>
            <mat-error *ngIf="accountForm.get('userId')?.hasError('required')">
              Le propriétaire est requis
            </mat-error>
          </mat-form-field>
        </div>
        
        <div class="form-row checkbox-row" *ngIf="isEditMode">
          <mat-checkbox formControlName="active">Compte actif</mat-checkbox>
        </div>
      </form>
      
      <div class="loading-container" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    </div>
    
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" [disabled]="loading">Annuler</button>
      <button mat-raised-button color="primary" (click)="onSubmit()" [disabled]="accountForm.invalid || loading">
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
    
    .checkbox-row {
      margin-top: 8px;
    }
    
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 16px;
    }
  `]
})
export class AdminAccountFormComponent implements OnInit {
  accountForm: FormGroup;
  isEditMode = false;
  loading = false;
  accountTypes: string[] = [];
  filteredUsers: Observable<User[]> = of([]);
  allUsers: User[] = [];
  
  constructor(
    private fb: FormBuilder,
    private accountService: AdminBankAccountService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AdminAccountFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { account?: BankAccount }
  ) {
    this.accountForm = this.fb.group({
      iban: ['', Validators.required],
      accountNumber: ['', Validators.required],
      balance: [0, Validators.required],
      type: ['', Validators.required],
      userId: ['', Validators.required],
      userSearch: [''],
      active: [true]
    });
    
    this.isEditMode = !!data?.account;
  }
  
  ngOnInit(): void {
    this.loadAccountTypes();
    this.loadAllUsers();
    
    if (this.isEditMode && this.data.account) {
      this.populateForm(this.data.account);
    }
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
  
  loadAllUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
        this.setupUserSearch();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users', error);
        this.showErrorMessage('Erreur lors du chargement des utilisateurs');
        this.loading = false;
      }
    });
  }
  
  setupUserSearch(): void {
    this.filteredUsers = this.accountForm.get('userSearch')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const searchTerm = typeof value === 'string' ? value.toLowerCase() : '';
        return this.allUsers.filter(user => 
          user.username.toLowerCase().includes(searchTerm) || 
          (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
          (user.lastName && user.lastName.toLowerCase().includes(searchTerm))
        );
      })
    );
  }
  
  populateForm(account: BankAccount): void {
    this.accountForm.patchValue({
      iban: account.iban,
      accountNumber: account.accountNumber,
      balance: account.balance,
      type: account.type,
      userId: account.userId,
      userSearch: account.userFullName,
      active: account.active
    });
  }
  
  onUserSelected(event: any): void {
    this.accountForm.patchValue({
      userId: event.option.value
    });
  }
  
  onSubmit(): void {
    if (this.accountForm.invalid) {
      return;
    }
    
    this.loading = true;
    const formValue = this.accountForm.value;
    
    const account: BankAccount = {
      id: this.isEditMode && this.data.account ? this.data.account.id : 0,
      iban: formValue.iban,
      accountNumber: formValue.accountNumber,
      balance: formValue.balance,
      type: formValue.type,
      active: formValue.active,
      userId: formValue.userId,
      userFullName: '' // This will be populated by the backend
    };
    
    if (this.isEditMode) {
      this.updateAccount(account);
    } else {
      this.createAccount(account);
    }
  }
  
  createAccount(account: BankAccount): void {
    this.accountService.createAccount(account).subscribe({
      next: (response) => {
        this.loading = false;
        this.showSuccessMessage('Compte créé avec succès');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error creating account', error);
        this.showErrorMessage('Erreur lors de la création du compte');
      }
    });
  }
  
  updateAccount(account: BankAccount): void {
    this.accountService.updateAccount(account.id!, account).subscribe({
      next: (response) => {
        this.loading = false;
        this.showSuccessMessage('Compte mis à jour avec succès');
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error updating account', error);
        this.showErrorMessage('Erreur lors de la mise à jour du compte');
      }
    });
  }
  
  onCancel(): void {
    this.dialogRef.close(false);
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