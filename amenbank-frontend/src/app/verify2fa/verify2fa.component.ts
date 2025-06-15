import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="verify-2fa-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Vérification à deux facteurs</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Code de vérification</mat-label>
              <input 
                matInput 
                formControlName="token" 
                type="text" 
                placeholder="Entrez le code reçu"
                required>
              <mat-error *ngIf="form.get('token')?.invalid && form.get('token')?.touched">
                Le code est requis
              </mat-error>
            </mat-form-field>

            <button 
              mat-raised-button 
              color="primary" 
              type="submit"
              [disabled]="form.invalid || isLoading"
              class="full-width">
              {{ isLoading ? 'Vérification...' : 'Vérifier' }}
            </button>
          </form>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .verify-2fa-container {
      max-width: 400px;
      margin: 40px auto;
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .error-message {
      color: #f44336;
      margin-top: 16px;
      text-align: center;
    }

    mat-card-header {
      margin-bottom: 20px;
    }

    mat-card-title {
      color: #1976d2;
    }
  `]
})
export class Verify2FAComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      token: ['', Validators.required]
    });
  }

  ngOnInit() {
    // Check if we have a pending username
    const username = sessionStorage.getItem('pendingUsername');
    if (!username) {
      this.router.navigate(['/login']);
    }
  }

  onSubmit() {
    if (this.form.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';

      const username = sessionStorage.getItem('pendingUsername');
      if (!username) {
        this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        this.router.navigate(['/login']);
        return;
      }

      this.authService.verify2FA({
        username,
        token: this.form.value.token
      }).subscribe({
        next: (response) => {
          if (response.token) {
            // Clean up
            sessionStorage.removeItem('pendingUsername');
            
            // Show success message
            this.snackBar.open('Vérification réussie !', 'OK', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
              panelClass: ['success-snackbar']
            });

            // Get role and redirect
            const role = this.authService.getRole();
            setTimeout(() => {
              switch (role) {
                case 'SUPERADMIN':
                  this.router.navigate(['/admin/users']);
                  break;
                case 'CLIENT':
                  this.router.navigate(['/client/dashboard']);
                  break;
                default:
                  this.router.navigate(['/home']);
              }
            }, 1000);
          } else {
            this.errorMessage = response.message || 'Erreur de vérification';
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('2FA verification error:', error);
          this.errorMessage = error.error?.message || 'Code invalide ou expiré';
          this.isLoading = false;
        }
      });
    }
  }
}
