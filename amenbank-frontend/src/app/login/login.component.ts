// login.component.ts
import { Component } from '@angular/core';
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
  selector: 'app-login',
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
  templateUrl: './login.component.html',     
  styleUrls: ['./login.component.scss'] 
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  isLoading = false;
 
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  onSubmit() {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { username, password } = this.loginForm.value;
      console.log('🔄 Attempting login for:', username);
      
      this.authService.login(username, password).subscribe({
        next: (res) => {
          console.log('✅ Login response:', res);
          
          if (res.twoFactorRequired) {
            console.log('🔄 Two-factor authentication required');
            // Store username for 2FA verification
            sessionStorage.setItem('pendingUsername', username);
            this.snackBar.open('Veuillez vérifier votre code à deux facteurs', 'OK', {
              duration: 5000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
            this.router.navigate(['/verify-2fa']);
          } else if (res.token) {
            console.log('✅ Token received, length:', res.token.length);
            // Token is already saved by the service
            const role = res.role || this.authService.getRole();
            console.log('🔥 User role:', role);
            
            this.showSuccessMessage();
            
            setTimeout(() => {
              this.redirectBasedOnRole(role);
            }, 1000);
          } else {
            console.warn('⚠️ No token in response:', res);
            this.errorMessage = res.message || 'Une erreur est survenue lors de la connexion';
          }
          this.isLoading = false;
        },
        error: (err) => {
          console.error('❌ Login error:', err);
          this.errorMessage = this.getErrorMessage(err);
          this.isLoading = false;
          
          // Show error in snackbar for better visibility
          this.snackBar.open(this.errorMessage, 'OK', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        },
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private showSuccessMessage() {
    this.snackBar.open('Connexion réussie !', 'OK', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private redirectBasedOnRole(role: string | null) {
    console.log('🔄 Redirecting based on role:', role);
    
    switch (role) {
      case 'SUPERADMIN':
        console.log('🔥 Redirecting to admin/users');
        this.router.navigate(['/admin/users']);
        break;
      case 'CLIENT':
        console.log('🔥 Redirecting to client dashboard');
        this.router.navigate(['/client/dashboard']);
        break;
      default:
        console.log('⚠️ Unknown role, redirecting to home');
        this.router.navigate(['/home']);
        break;
    }
  }

  private getErrorMessage(err: any): string {
    console.log('Error object:', err);
    
    if (err.error && typeof err.error === 'string') {
      return err.error;
    } else if (err.error && err.error.message) {
      return err.error.message;
    } else if (err.status === 0) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion ou contactez l\'administrateur.';
    } else if (err.status === 401) {
      return 'Nom d\'utilisateur ou mot de passe incorrect.';
    } else if (err.message) {
      return err.message;
    } else {
      return 'Échec de la connexion. Veuillez réessayer.';
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }
}